import React, {useMemo, useState} from 'react';
import {Alert, Button, Segmented} from 'antd';
import {identity} from './pc/data.js';
import {PageHead} from './pc/ui.jsx';
import LegacyKnowledge from './knowledge/LegacyKnowledge.jsx';
import ContributionDrawer from './knowledge/ContributionDrawer.jsx';
import MaterialDrawer from './knowledge/MaterialDrawer.jsx';
import {KnowledgeDashboard, MaterialDirectory, KnowledgeAssistant, KnowledgeWorks} from './knowledge/Workbench.jsx';
import {runtimeKnowledgeService} from './knowledge/service.js';
import DistributionDrawer from './knowledge/DistributionDrawer.jsx';
import DistributionPanel from './knowledge/DistributionPanel.jsx';
import {distributionEntry} from './knowledge/distribution-model.js';
import {runtimeDistributionService} from './knowledge/distribution-service.js';
import './pc/knowledge.css';
export {CustomerPicker} from './knowledge/LegacyKnowledge.jsx';
const TABS = [{value: 'dashboard', label: '知识看板'}, {value: 'materials', label: '资料目录'}, {value: 'assistant', label: '知识助手'}, {value: 'works', label: '生成材料 / 我的作品'}];
function KnowledgeWorkspace({page, service, distributionService}) {
  const entry=distributionEntry(page?.options);
  const [distributionOpen,setDistributionOpen]=useState(false),[distributionMaterial,setDistributionMaterial]=useState(entry?.distribution?entry.materialId:null);
  const initial = page?.options?.tab;
  const [tab, setTab] = useState(TABS.some(row => row.value === initial) ? initial : 'dashboard');
  const [legacy, setLegacy] = useState(['catalog', 'playbook', 'proposal'].includes(initial) ? initial : null);
  const [legacyExtra, setLegacyExtra] = useState(page?.options?.solution || null);
  const [filters, setFilters] = useState({}), [refresh, setRefresh] = useState(0), [selected, setSelected] = useState(entry&&!entry.distribution?{id:entry.materialId}:null), [contribute, setContribute] = useState(null), [notice, setNotice] = useState('');
  const go = value => {setLegacy(null); setTab(value); setNotice('');};
  const directory = next => {setFilters(next); go('materials');};
  const openMaterial = (id, versionId = null) => setSelected({id, versionId});
  return <div className="pc-page pc-knowledge kb122-workspace">
    <PageHead title="知识库" subtitle="找到、贡献和使用当前有权限的资料" extra={<><Button onClick={()=>setDistributionOpen(true)}>对客分发与问卷</Button><Button onClick={() => setLegacy(legacy ? null : 'catalog')}>{legacy ? '返回知识工作台' : '业务参考'}</Button></>} />
    <Segmented className="kb122-navigation" aria-label="知识库页面" options={TABS} value={legacy ? null : tab} onChange={go} />
    {notice && <Alert type="success" showIcon title={notice} closable onClose={() => setNotice('')} />}
    {legacy ? <><Alert type="info" showIcon title="业务参考" description="这里保留运营维护的方案与定价、CRM 客户 Playbook 和规则拼装草稿；客户经营建议使用原有分析服务。" /><LegacyKnowledge key={`${legacy}:${legacyExtra || ''}`} page={{options: {tab: legacy, solution: legacyExtra}}} onNavigate={(value, extra) => {setLegacy(value); setLegacyExtra(new URLSearchParams(extra.replace(/^&/, '')).get('solution'));}} /></>
      : tab === 'dashboard' ? <KnowledgeDashboard service={service} onDirectory={directory} />
      : tab === 'materials' ? <MaterialDirectory key={JSON.stringify(filters)} service={service} refresh={refresh} initialFilters={filters} onOpen={openMaterial} onContribute={() => setContribute({})} />
      : tab === 'assistant' ? <KnowledgeAssistant service={service} onOpen={openMaterial} />
      : <KnowledgeWorks service={service} onOpen={openMaterial} />}
    {selected && <MaterialDrawer key={`${selected.id}:${selected.versionId || ''}`} service={service} materialId={selected.id} initialVersionId={selected.versionId} onDistribution={()=>setDistributionMaterial(selected.id)} onClose={() => setSelected(null)} onChanged={() => setRefresh(value => value + 1)} onEdit={material => {setSelected(null); setContribute({target: material});}} />}
    {distributionOpen&&<DistributionPanel service={distributionService} refresh={refresh} onOpen={setDistributionMaterial} onClose={()=>setDistributionOpen(false)}/>}
    {distributionMaterial&&<DistributionDrawer key={distributionMaterial} service={distributionService} materialService={service} materialId={distributionMaterial} onChanged={()=>setRefresh(value=>value+1)} onClose={()=>setDistributionMaterial(null)}/>}
    {contribute && <ContributionDrawer key={contribute.target?.material_id || 'new'} service={service} target={contribute.target} onClose={() => setContribute(null)} onSaved={material => {setContribute(null); setRefresh(value => value + 1); setNotice('材料已保存并重新读取，处理状态请查看版本详情。'); openMaterial(material.material_id);}} />}
  </div>;
}
export default function Knowledge({page, service: injectedService, distributionService: injectedDistribution}) {
  const actor = identity();
  const service = useMemo(() => injectedService || runtimeKnowledgeService(), [injectedService, actor]);
  const distributionService=useMemo(()=>injectedDistribution||runtimeDistributionService(),[injectedDistribution,actor]);
  return <KnowledgeWorkspace key={actor} page={page} service={service} distributionService={distributionService} />;
}
