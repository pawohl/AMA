{Arzneistoff Suchmaschine - JSONP data file reader - License: MIT}

{The MIT License (MIT)

Copyright (c) 2014 Felix Pahlow

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.}

unit JSONHandler;

{$mode objfpc}{$H+}

interface

uses
  Classes, SysUtils, FileUtil, fpJSON, JSONParser, Dialogs, Forms, LCLType, Controls, regexpr, resource;

const
 jsonCompoundDataFile = 'compoundData.js';
 jsonHrfCorrDataFile = 'hrfcorr.js';
 jsonRenderFieldsDataFile = 'renderfields.js';

type

 ECustomException = class(Exception);


 { TDataStore }
 TDataStore = class(TObject)
 Protected
   htmlentities: TJSONObject;
   function MemoryStreamToString(M: TMemoryStream): String;
   function GetApplicationDirectory(): String;
   function OpenJSONFile(const AFileName: String; const ADesc: String): TJSONData;
   procedure WriteConfigFile(const ConfigLocation: String; const FilePath: String; const version: String);
   function OpenJSONDataFiles(const dlg: TOpenDialog; const version: String): TJSONData;
   function __OpenJSONDataFiles(const baseDir: String; const compoundDataFile: String): TJSONData;
   function openSideBySide(const AppDir: String): TJSONData;
   procedure satizeHTMLData();
   function replaceHTMLEntities(const input: String): String;
   function replaceHTMLTags(const input: String): String;
  Public
   compoundData: TJSONArray;
   hrfCorr: TJSONArray;
   renderfields: TJSONArray;
   Constructor Create(const dlg: TOpenDialog; const version: String);
   destructor Destroy(); override;
 end;



implementation


constructor TDataStore.Create(const dlg: TOpenDialog; const version: String);
var
  RS: TResourceStream;
  P : TJSONParser;

begin
  Inherited Create;

  { Load HTML Entity map }
  RS := TResourceStream.Create(hInstance, 'HTMLENTITYMAP', PChar(RT_RCDATA));
  P := TJSONParser.Create(RS);
  try
    P.Strict := true;
    htmlentities := P.Parse as TJSONObject;
  finally
    P.Free;
  end;

  OpenJSONDataFiles(dlg, version);
end;

destructor TDataStore.Destroy;
begin
  FreeAndNil(compoundData);
  FreeAndNil(hrfCorr);
  inherited Destroy;
end;

function TDataStore.MemoryStreamToString(M: TMemoryStream): String;
begin
  SetString(Result, PChar(M.Memory), M.Size div SizeOf(Char));
end;

function TDataStore.GetApplicationDirectory(): String;

begin
  Result := ExtractFilePath(ParamStr(0));
end;

function TDataStore.OpenJSONFile(Const AFileName: String; const ADesc: String): TJSONData;

Var
  MS: TMemoryStream;
  P : TJSONParser;
  D : TJSONData;
  R:  TRegExpr;
  RS: String;
begin
  MS := TMemoryStream.Create;
  MS.LoadFromFile(AFileName);
  R:=TRegExpr.Create;

  if (MS.Size < 2) or (MS.Size > (50*1024*1024)) then
  begin
    if MessageDlg(
               'JSON-File possibly corrupt',
               'File size of ' + ADesc +
               ' either under 2 B or bigger than 50 MiB.' + LineEnding +
               'File location: ' + AFileName + LineEnding +
               'Would you like to continue anyway?',
               mtConfirmation,
               [mbYes, mbNo], 0) = mrNo then begin
                 MS.Free;
                 R.Free;
                 exit;
               end;
  end;
  {Remove the -P part (JSONP-P = JSON) and attempt to parse JSON}
  RS := MemoryStreamToString(MS);
  R.Expression := '^[^\{\"]+\((.+)\);?$';
  RS:=R.Replace(RS, '$1', true);
  try
    P:=TJSONParser.Create(RS);
    try
      P.Strict:=true;
      D:=P.Parse;
    finally
      P.Free;
    end;
  finally
    MS.Free;
    R.Free;
  end;
  Result:=D;
end;

procedure TDataStore.WriteConfigFile(const ConfigLocation: String; const FilePath: String; const version: String);
var
  CfgObj: TJSONData;
  Cfg2SaveFS : TFileStream;
  Cfg2SaveJSON : String;
begin
  {Attempt to write a config file}
  try
     CfgObj := TJSONObject.Create;
     try
          mkdir(ExtractFilePath(ConfigLocation));
     except
     end;
     Cfg2SaveFS := TFileStream.Create(ConfigLocation, fmCreate);
     TJSONObject(CfgObj).Add('appVersion', version);
     TJSONObject(CfgObj).Add('dataFileLocation', FilePath);
     try
       If Assigned(CfgObj) then
         Cfg2SaveJSON := CfgObj.AsJSON;
       If Length(Cfg2SaveJSON) > 0 then
         Cfg2SaveFS.WriteBuffer(Cfg2SaveJSON[1], Length(Cfg2SaveJSON));
     finally
       Cfg2SaveFS.Free;
       CfgObj.Free;
     end;
  except
    // Nothing
  end;
end;

function TDataStore.__OpenJSONDataFiles(const baseDir: String; const compoundDataFile: String): TJSONData;
var
  compoundDataFilePath: String;
begin
  Result := nil;
  compoundDataFilePath := baseDir + DirectorySeparator + compoundDataFile;
  if not FileExists(compoundDataFilePath) then exit;

  compoundData := OpenJSONFile(compoundDataFilePath, 'compound data file') as TJSONArray;
  { Assume the hrfCorr file is in the same directory }
  hrfCorr := OpenJSONFile(baseDir + DirectorySeparator + jsonHrfCorrDataFile, 'hrf correction data file') as TJSONArray;
  renderfields := OpenJSONFile(baseDir + DirectorySeparator + jsonRenderFieldsDataFile, 'render fields data file') as TJSONArray;

  result := compoundData;
end;

procedure TDataStore.satizeHTMLData();
var
  i: Integer;
  r: TJSONObject;
  h: TJSONData;
  x: Integer;
  c: TJSONObject;
  m: Integer;
  f: String;
  v: String;
begin
  if not Assigned(compoundData) or not Assigned(renderfields) then exit;

  For i := 0 to renderfields.count - 1 do
  begin
    r := TJSONObject(renderfields.items[i]);
    h := r.Elements['html'];
    f := r.Strings['k'];

    if ((h.JSONType = jtString) and (h.AsString = '1')) or ((h.JSONType = jtNumber) and (h.AsInt64 = 1)) then
    begin
       // HTML field
       // Iterate over compounds
       for x := 0 to compoundData.count - 1 do
       begin
         // Iterate over all fields of one compound
         c := compoundData.items[x] as TJSONObject;
         for m := 0 to c.count - 1 do
         begin
           // Replace entities and HTML markup for some fields
           if f = c.names[m] then
           begin
             v := c.items[m].AsString;
             if v <> '' then
             begin
               v := replaceHTMLTags(v);
               v := replaceHTMLEntities(v);
               c.items[m].AsString := v;
             end;
           end;
         end;
       end;
    end;
  end;
end;

function TDataStore.replaceHTMLTags(const input: String): String;
var
  o:  String;
  R:  TRegExpr;
begin
  R:=TRegExpr.Create;
  o := input;

  R.ModifierI := true;
  R.ModifierG := true;
  R.Expression := '<sub[^>]*>s</sub>';
  o := R.Replace(o, 's', true);

  R.Expression := '<sub[^>]*>a</sub>';
  o := R.Replace(o, 'a', true);

  R.Expression := '<sup[^>]*>2</sup>';
  o := R.Replace(o, '²', true);

  R.Expression := '<sup[^>]*>3</sup>';
  o := R.Replace(o, '³', true);

  { Strip all remaining HTML }
  R.Expression := '<([^>]+)>(.*?)</\1>';
  o := R.Replace(o, '$2', true);

  R.Expression := '<[^>]+/>';
  o := R.Replace(o, '', true);

  Result := o;
  FreeAndNil(R);
end;

function TDataStore.replaceHTMLEntities(const input: String): String;
var
  i: Integer;
  o: String;
begin
  o := input;
  for i := 0 to htmlentities.count - 1 do
  begin
    o := StringReplace( o, htmlentities.Names[i], htmlentities.Items[i].AsString, [rfReplaceAll] );
  end;
  Result := o;
end;

// That's better written as nested procedure but in FPC this
// doesn't seem to be Common Practise
function TDataStore.openSideBySide(const AppDir: String): TJSONData;
begin
  Result := __OpenJSONDataFiles(AppDir + 'data', jsonCompoundDataFile);
end;

function TDataStore.OpenJSONDataFiles(const dlg: TOpenDialog; const version: String): TJSONData;
var
  CfgFile: String;
  CfgObj:  TJSONObject;
  AppDir:  String;
  SideBySidePath: String;
  JSONDataFileContents: TJSONData;

begin
  CfgFile := GetAppConfigFile(False);
  AppDir := GetApplicationDirectory();
  JSONDataFileContents := nil;

  { First, check whether data was side-by-side deployed }
  SideBySidePath := AppDir + 'data' + DirectorySeparator + jsonCompoundDataFile;

  if FileExists(SideBySidePath) then
  begin
    JSONDataFileContents := openSideBySide(AppDir);
  end;

  if Assigned(JSONDataFileContents) then // Nothing
  else if FileExists(CfgFile) then
  begin
    CfgObj := OpenJSONFile(CfgFile, 'configuration file') as TJSONObject;
    if Assigned(CfgObj) and
       (CfgObj.Find('dataFileLocation') <> nil) and
       FileExists(CfgObj.Strings['dataFileLocation']) then
    begin
      { Config file is sane }
      JSONDataFileContents := __OpenJSONDataFiles(
                           ExtractFileDir(CfgObj.Strings['dataFileLocation']),
                           ExtractFileName(CfgObj.Strings['dataFileLocation'])
      );
      if not Assigned(JSONDataFileContents) then
      begin
        MessageDlg(
                   'Invalid JSON data',
                   'Data cannot be read as JSON at ' + CfgObj.Strings['dataFileLocation'],
                   mtError, [mbOK], 0
        );
      end;
    end else
    begin
      { Invalid config file }
      { Skip config and attempt reading file directly from hardcoded position }
      JSONDataFileContents := openSideBySide(AppDir);
      if not Assigned(JSONDataFileContents) then
      begin
        MessageDlg(
                   'Invalid JSON data and configuration file',
                   'The configuration file at ' + CfgFile + ' is invalid and ' +
                   'data cannot be found or read at the default location ' + AppDir + 'data',
                   mtError, [mbOK], 0
        );
      end;
    end;
  end else
  begin
    if dlg.Execute then
    begin
      { Write config if it's a valid JSON file }
      JSONDataFileContents := __OpenJSONDataFiles(
                          ExtractFileDir(dlg.FileName),
                          ExtractFileName(dlg.FileName)
      );
      if Assigned(JSONDataFileContents) then
      begin
         WriteConfigFile(CfgFile, dlg.FileName, version);
      end else
      begin
        MessageDlg(
                   'Invalid JSON Data File supplied',
                   'The data file supplied could not be read.',
                   mtError, [mbOK], 0
        );
      end;
    end else
    begin
      MessageDlg(
                 'No data to work with',
                 'There is no fresh data that could be displayed. Data displayed may be outdated.',
                 mtError, [mbOK], 0
      );
    end;
  end;
  satizeHTMLData();
  Result := JSONDataFileContents;
end;

end.

