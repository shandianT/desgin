// Execute the supplied 1.1 behavior contracts against the generated Web modules.
// The reference package is not needed after checkout; no network or business API.
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,cpSync,rmSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const bundle=JSON.parse(readFileSync(join(root,'demo/web/bundle.js'),'utf8').slice('window.SALES_BUNDLE='.length).trim().replace(/;$/,''));
const temp=mkdtempSync(join(tmpdir(),'salesbuddy-v110-contracts-'));
try {
  for(const [id,source] of Object.entries(bundle.modules)) {
    const file=join(temp,'miniprogram',id+'.js');mkdirSync(dirname(file),{recursive:true});writeFileSync(file,source);
  }
  cpSync(join(root,'demo/web-src/business'),join(temp,'miniprogram'),{recursive:true,filter:source=>!source.endsWith('.js')});
  cpSync(join(root,'tools/v110-contract-tests'),join(temp,'tests'),{recursive:true});
  const tests=readdirSync(join(temp,'tests')).filter(name=>name.endsWith('.test.cjs')).map(name=>join(temp,'tests',name));
  const result=spawnSync(process.execPath,['--test',...tests],{stdio:'inherit'});
  process.exitCode=result.status??1;
} finally {rmSync(temp,{recursive:true,force:true});}
