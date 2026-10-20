import React, {useEffect, useRef, useState} from 'react';
import {Alert, Button, Pagination, Segmented, Select, Table} from 'antd';
import {Input} from '../ImeInput.jsx';
import {identity} from '../pc/data.js';
import {Empty2, Kpi, LoadState, Panel, Tag2} from '../pc/ui.jsx';
import {useKnowledgeRead} from './hooks.js';
import {CATEGORIES, SCOPES, countText, formatObservedAt, materialStateLabel, newRequestKey, optionLabel, productFilterOptions, sourceStatusLabel, stateLabel} from './model.js';
import {errorText, isGenerationInputError, openAuthorizedFile} from './service.js';
import WorkShareDrawer from './WorkShareDrawer.jsx';

export const LIBRARIES = [{value: 'all', label: '全部可见'}, {value: 'personal', label: '我的个人库'}, {value: 'team', label: '团队库'}, {value: 'shared', label: '共享给我'}];
export function LibraryFilter({value, onChange, disabled}) {return <Segmented value={value} onChange={onChange} options={LIBRARIES.map(row => ({...row, disabled: disabled && row.value !== 'all'}))} />;}
export function KnowledgeDashboard({service, onDirectory}) {
  const [filters, setFilters] = useState({scope: 'all', period: 'all'});
  const update = patch => setFilters(current => ({...current, ...patch}));
  const stats = useKnowledgeRead(() => service.getStats(filters), [service, JSON.stringify(filters)]);
  const categories = stats.value?.categories || [], products = stats.value?.products || [];
  return <><div className="kb122-toolbar"><LibraryFilter disabled={service.features?.scope === false} value={filters.scope} onChange={scope => update({scope})} /><Button onClick={stats.reload}>刷新统计</Button></div><div className="kb122-filters"><Select aria-label="看板内容类别" allowClear placeholder="全部类别" options={CATEGORIES} value={filters.content_category} onChange={content_category => update({content_category})} /><Select aria-label="看板产品" allowClear placeholder="全部产品" options={productFilterOptions(products)} value={filters.product_code} onChange={product_code => update({product_code})} /><Select aria-label="看板时间" value={filters.period} onChange={period => update({period})} options={[{value: 'all', label: '全部收录'}, {value: '30d', label: '近 30 天新增'}]} /></div>
    <LoadState loading={stats.loading} error={stats.error} onRetry={stats.reload}>
      {stats.value && <>
        <p className="pc-muted">{stats.value.scope_label || '当前登录用户的可见材料'} · {stats.value.source === 'salesbuddy.internal_materials' ? 'SalesBuddy 内部资料库' : stats.value.source || '统计来源待确认'} · 统计于 {formatObservedAt(stats.value.observed_at)}</p><p className="pc-muted">个人库包含本人已共享资料；范围之间可能重叠。可检索和处理异常按不同版本判断，不可相加作为总数。</p>
        <div className="kb122-kpis">{[['total', '可见材料', {}], ['added_30d', '近 30 天新增', {period: '30d'}], ['retrievable', '可检索材料', {retrievable: true}], ['failed', '处理异常', {state: 'failed'}]].map(([key, label, drill]) => <Kpi key={key} label={label} value={countText(stats.value.metrics?.[key])} hint={stats.value.metrics?.[key]?.message || '当前授权范围'} onClick={!Object.keys(drill).length || service.features?.filters !== false ? () => onDirectory({...filters, ...drill}) : undefined} />)}</div>
        <div className="kb122-two"><Panel title="内容类别" note="点击查看对应资料">{categories.length ? categories.map(row => <button key={row.code} type="button" className="kb122-chart-row" onClick={() => onDirectory({...filters, content_category: row.code})}><span>{optionLabel(CATEGORIES, row.code)}</span><meter min="0" max={Math.max(1, ...categories.map(item => Number(item.count) || 0))} value={Number(row.count) || 0} /><b>{row.count}</b></button>) : <Empty2 title="暂无类别统计" />}</Panel>
          <Panel title="产品覆盖" note="当前授权范围">{products.length ? products.map(row => <button key={row.code} type="button" className="kb122-chart-row" onClick={() => onDirectory({...filters, product_code: row.code})}><span>{row.label}</span><meter min="0" max={Math.max(1, ...products.map(item => Number(item.count) || 0))} value={Number(row.count) || 0} /><b>{row.count}</b></button>) : <Empty2 title="暂无产品统计" />}</Panel></div>
      </>}
    </LoadState></>;
}
export function MaterialDirectory({service, refresh, initialFilters, onOpen, onContribute}) {
  const [filters, setFilters] = useState({scope: 'all', q: '', ...initialFilters}), [queryDraft, setQueryDraft] = useState(initialFilters.q || ''), [offset, setOffset] = useState(0);
  const update = patch => {setFilters(current => ({...current, ...patch})); setOffset(0);};
  const commitQuery = () => update({q: queryDraft.trim()});
  const data = useKnowledgeRead(() => service.listMaterials({...filters, offset, page_size: 20}), [service, JSON.stringify(filters), offset, refresh]);
  return <>
    <div className="kb122-toolbar"><LibraryFilter disabled={service.features?.scope === false} value={filters.scope} onChange={scope => update({scope})} /><Button type="primary" disabled={data.value?.capabilities?.create !== true} onClick={onContribute}>贡献资料</Button></div>
    {service.features?.filters === false && <p className="pc-muted">当前展示全部可见资料；多维筛选接入后开放。</p>}<div className="kb122-filters"><Input.Search disabled={service.features?.filters === false} aria-label="搜索资料" placeholder="按名称搜索当前可见资料" maxLength={200} value={queryDraft} onChange={event => setQueryDraft(event.target.value)} onSearch={commitQuery} allowClear />
      <Select disabled={service.features?.filters === false} aria-label="筛选内容类别" placeholder="全部类别" allowClear value={filters.content_category} options={CATEGORIES} onChange={content_category => update({content_category})} />
      <Select disabled={service.features?.filters === false} aria-label="筛选产品" placeholder="全部产品" allowClear value={filters.product_code} options={productFilterOptions(data.value?.product_options)} onChange={product_code => update({product_code})} />
      <Select disabled={service.features?.filters === false} aria-label="筛选处理状态" placeholder="全部状态" allowClear value={filters.state} options={['saved', 'syncing', 'parsing', 'retrievable', 'failed'].map(value => ({value, label: stateLabel(value)}))} onChange={state => update({state})} />
      <Button onClick={data.reload}>刷新目录</Button></div>
    {filters.period === '30d' && <p className="pc-muted">近 30 天新增 <Button type="link" onClick={() => update({period: undefined})}>清除时间筛选</Button></p>}
    {filters.retrievable === true && <p className="pc-muted">当前检索版本可用 <Button type="link" onClick={() => update({retrievable: undefined})}>清除检索筛选</Button></p>}<LoadState loading={data.loading} error={data.error} onRetry={data.reload}>
      {data.value && <Panel title="资料目录" note={data.value.scope_label || '仅展示当前可读资料'} bodyClassName="is-flush"><Table rowKey="material_id" pagination={false} dataSource={data.value.items || []} scroll={{x: 1050}}
        locale={{emptyText: <Empty2 title="当前条件下没有可见资料" description="可调整筛选，或贡献第一份资料。" />}}
        columns={[
          {title: '内容名称', dataIndex: 'content_name', width: 300, render: (value, row) => <><button className="pc-link" onClick={() => onOpen(row.material_id)}>{row.source?.original_name || value}</button>{row.source && <><br/><small className="pc-muted">飞书弹药库导入</small></>}</>},
          {title: '产品 / 类别', render: (_, row) => <>{row.source?.product_label || row.product_label || row.product_code}<br/><small>{row.source?.category_label || optionLabel(CATEGORIES, row.content_category)}</small></>},
          {title: '业务范围', dataIndex: 'content_scope', render: value => optionLabel(SCOPES, value)},
          {title: '客户 / 行业', render: (_, row) => <>{row.customer_name || '—'}<br/><small>{row.industry_label || row.industry_code || '—'}</small></>},
          {title: '版本 / 状态', render: (_, row) => <>{row.source && <><small>原表：{sourceStatusLabel(row.source.source_status)}</small><br/></>}<Tag2 tone={row.state === 'failed' ? 'danger' : row.state === 'retrievable' ? 'success' : 'neutral'}>{row.source ? '系统：' : ''}{materialStateLabel(row.state, row.source)}</Tag2><br/><small>{row.version_no ? `V${row.version_no}` : '版本待确认'}{row.active_version_state === 'retrievable' && row.active_version_id !== row.version_id ? ' · 旧版仍可检索' : ''}{row.source && (row.source.validation_issues?.length ? ' · 待补全' : ' · 不可检索')}</small></>},
          {title: '系统共享', dataIndex: 'sharing_label', render: value => value || '当前授权'},
          {title: '提供人 / 更新', render: (_, row) => <>{row.source ? row.source.provider_name || '原表未填写' : row.contributor_name || row.contributor_user_id || '—'}<br/><small>{row.updated_at || '—'}</small></>},
          {title: '操作', render: (_, row) => <Button type="link" onClick={() => onOpen(row.material_id)}>查看</Button>},
        ]} /><div className="kb122-pagination">{Number.isInteger(data.value.total) ? <Pagination current={offset / 20 + 1} pageSize={20} total={data.value.total} showSizeChanger={false} onChange={page => setOffset((page - 1) * 20)} /> : <><Button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 20))}>上一页</Button><Button disabled={!data.value.has_more} onClick={() => setOffset(data.value.next_offset ?? offset + 20)}>下一页</Button></>}</div></Panel>}
    </LoadState></>;
}
function ProviderNotice({value, label}) {
  if (value?.status === 'available') return null;
  return <Alert type="info" showIcon title={value?.message || `${label}尚未配置`} description="管理员完成连接与能力验证后开放；已保存资料和已归档作品仍可按当前权限查看、下载和管理。" />;
}
// These exact workflow errors are sealed failure receipts: no work was archived,
// and replaying their key cannot start another run. There is no retryable flag.
// Unknown workflow/transport outcomes stay locked; never infer finality from 503.
function generationFailureText(code) {
  if (code === 'KNOWLEDGE_DOCUMENT_AUTH_UNAVAILABLE') return '文档生成服务授权失败，未生成可下载作品。请联系管理员修复服务授权后，再准备新的生成请求。';
  if (['KNOWLEDGE_DOCUMENT_RUN_FAILED', 'KNOWLEDGE_DOCUMENT_RUN_STOPPED'].includes(code)) return '文档生成流程已失败或停止，未生成可下载作品。请确认原因并处理后，再准备新的生成请求。';
  if (code === 'KNOWLEDGE_DOCUMENT_DOWNLOAD_UNAVAILABLE' || [
    'MEDIA_TYPE', 'REDIRECT', 'CONTENT_ENCODING', 'CONTENT_LENGTH', 'TOO_LARGE',
    'METADATA', 'CONFIGURATION', 'URL_NOT_ALLOWED', 'TIMEOUT', 'NETWORK',
  ].some(value => code === `KNOWLEDGE_ARTIFACT_DOWNLOAD_${value}`)) return '文档生成流程已返回，但文件未能取得，未生成可下载作品。请联系管理员检查文件下载权限与服务配置；处理后再准备新的生成请求。';
  if (['KNOWLEDGE_DOCUMENT_FILES_INVALID', 'KNOWLEDGE_DOCUMENT_FILES_LIMIT'].includes(code) || [
    'UNSAFE_PACKAGE', 'UNSAFE_RELATIONSHIP', 'INVALID_PACKAGE', 'LIMIT_EXCEEDED',
    'UNSAFE_CONTENT', 'INVALID_STRUCTURE', 'INVALID_XML', 'INVALID_RELATIONSHIP',
    'NOT_EDITABLE', 'FORMAT_UNSUPPORTED', 'FORMAT_MISMATCH',
  ].some(value => code === `KNOWLEDGE_ARTIFACT_${value}`)) return '生成文件未通过格式、大小或安全检查，未生成可下载作品。请联系管理员核对文档生成服务；处理后再准备新的生成请求。';
  return '';
}
function SourcePicker({service, values, onChange, enabled}) {
  const [queryDraft, setQueryDraft] = useState(''), [query, setQuery] = useState('');
  useEffect(() => { const timer = setTimeout(() => setQuery(queryDraft.trim()), 250); return () => clearTimeout(timer); }, [queryDraft]);
  const read = useKnowledgeRead(() => service.listMaterials({q: query, retrievable: true, page_size: 50, offset: 0}), [service, query], enabled);
  return <><Select mode="multiple" showSearch filterOption={false} aria-label="选择参考材料" placeholder="选择当前授权、可检索的参考材料" value={values} onChange={onChange} onSearch={setQueryDraft}
    options={(read.value?.items || []).filter(row => row.active_version_id && row.active_version_state === 'retrievable').map(row => ({value: row.material_id, label: `${row.content_name} · ${row.active_version_id && row.active_version_id !== row.version_id ? '当前检索版本' : `V${row.version_no}`}`}))} disabled={!enabled} loading={read.loading} />
    {read.error && <p className="pc-error" role="alert">{read.error}</p>}</>;
}
export function KnowledgeAssistant({service, onOpen}) {
  const actor = identity(), flight = useRef(false);
  const status = useKnowledgeRead(() => service.status(), [service]);
  const [question, setQuestion] = useState(''), [sources, setSources] = useState([]), [busy, setBusy] = useState(false), [error, setError] = useState(''), [answer, setAnswer] = useState(null);
  const available = status.value?.retrieval?.status === 'available';
  // Never feed cached answers/history back as evidence; the backend freezes a fresh scope.
  const ask = async () => {
    if (flight.current || !available || !question.trim() || !sources.length || actor !== identity()) return;
    flight.current = true; setBusy(true); setError(''); setAnswer(null);
    try {
      const value = await service.ask({question: question.trim(), material_ids: sources}, newRequestKey());
      if (actor !== identity()) return;
      if (!['answered', 'no_evidence'].includes(value?.status)) throw Error('知识助手尚未返回可核验的回答');
      if (value.status === 'answered' && (!value.answer || !value.citations?.length || value.citations.some(row => !row.material_id || !row.version_id || !row.location || !sources.includes(row.material_id)))) throw Error('回答缺少当前材料版本与出处，暂不展示');
      setAnswer(value);
    } catch (failure) {if (actor === identity()) setError(errorText(failure));}
    finally {flight.current = false; if (actor === identity()) setBusy(false);}
  };
  useEffect(() => { const clear = () => {if (document.visibilityState === 'hidden') setAnswer(null);}; document.addEventListener('visibilitychange', clear); return () => document.removeEventListener('visibilitychange', clear); }, []);
  return <LoadState loading={status.loading} error={status.error} onRetry={status.reload}><ProviderNotice value={status.value?.retrieval} label="知识检索" />
    <div className="kb122-two"><Panel title="知识助手" note="每次请求按当前权限重新查询"><div className="kb122-stack">
      <SourcePicker service={service} values={sources} onChange={value => {setSources(value); setAnswer(null);}} enabled={available && !busy} />
      <Input.TextArea aria-label="知识问题" rows={6} value={question} maxLength={4000} onChange={event => setQuestion(event.target.value)} placeholder="输入问题，回答将注明材料、版本和具体出处" disabled={!available || busy} />
      <Button type="primary" onClick={ask} loading={busy} disabled={!available || !question.trim() || !sources.length}>查找依据并回答</Button>
      <p className="pc-muted">未选参考材料时不发起检索。客户 AI 经营建议请到业务参考中的客户 Playbook 查看。</p>
    </div></Panel><Panel title="回答与引用">{error && <Alert type="error" title={error} />}{answer?.status === 'no_evidence' ? <Empty2 title="当前授权范围内未找到依据" /> : answer ? <><div className="kb122-answer">{answer.answer}</div><ol>{answer.citations.map((row, index) => <li key={`${row.material_id}:${row.version_id}:${index}`}><button className="pc-link" onClick={() => onOpen(row.material_id, row.version_id)}>{row.material_name || row.material_id} · V{row.version_no || row.version_id}</button><p>{row.location}</p>{row.quote && <blockquote>{row.quote}</blockquote>}</li>)}</ol></> : <Empty2 title="选择资料后开始提问" description="回答与引用只来自这次授权检索。" />}</Panel></div>
  </LoadState>;
}
export function KnowledgeWorks({service, onOpen}) {
  const actor = identity(), flight = useRef(false), request = useRef(null), selection = useRef(0), mounted = useRef(true);
  const status = useKnowledgeRead(() => service.status(), [service]);
  const [offset, setOffset] = useState(0);
  const works = useKnowledgeRead(() => service.listWorks({limit: 20, offset}), [service, offset]);
  const [purpose, setPurpose] = useState(''), [sources, setSources] = useState([]), [format, setFormat] = useState('docx'), [audience, setAudience] = useState('internal');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [receipt, setReceipt] = useState(null);
  const [sharing, setSharing] = useState(null), [notice, setNotice] = useState(''), [parent, setParent] = useState(null), [readingParent, setReadingParent] = useState(false), [unconfirmed, setUnconfirmed] = useState(false), [failedGeneration, setFailedGeneration] = useState(false);
  const available = status.value?.generation?.status === 'available', formats = status.value?.generation?.formats || [];
  // Provider status declares configured formats, not a successful generation probe.
  const enabledFormats = Array.isArray(formats) ? formats.filter(value => ['docx', 'pptx'].includes(value)) : [];
  useEffect(() => {mounted.current = true; return () => {mounted.current = false; selection.current++;};}, []);
  const current = () => mounted.current && actor === identity();
  const resetGeneration = () => {selection.current++; setParent(null); setPurpose(''); setSources([]); setReceipt(null); setReadingParent(false); setFailedGeneration(false); request.current = null;};
  const prepareNewGeneration = () => {
    if (flight.current || readingParent || !available || !failedGeneration || !current()) return;
    // Explicit acknowledgement only. Keep inputs/parent revision for review;
    // the next submit revalidates sources and creates a new idempotency key.
    request.current = null; setFailedGeneration(false); setError(''); setReceipt(null);
  };
  const nextVersion = async workId => {
    if (busy || unconfirmed || failedGeneration || !available || !current()) return;
    const serial = ++selection.current;
    setReadingParent(true); setError(''); setNotice('');
    try {
      const work = await service.getWork(workId);
      if (!current() || serial !== selection.current) return;
      if (work?.work_id !== workId || work.can_manage !== true || !Number.isInteger(work.revision) || !Array.isArray(work.sources)) throw Error('当前无法为此作品生成新版本，请刷新作品后重试');
      setParent(work); setPurpose(work.purpose || ''); setSources([...new Set(work.sources.map(source => source.material_id))]); setFormat(work.format || 'docx'); setAudience(work.audience || 'internal'); setReceipt(null); request.current = null;
    } catch (failure) {if (current() && serial === selection.current) setError(errorText(failure));}
    finally {if (current() && serial === selection.current) setReadingParent(false);}
  };
  const generate = async () => {
    if (flight.current || readingParent || failedGeneration || !available || !enabledFormats.includes(format) || !sources.length || !purpose.trim() || !current()) return;
    flight.current = true; setBusy(true); setError(''); setReceipt(null);
    try {
      const body = {purpose: purpose.trim(), material_ids: sources, format, audience, ...(parent ? {parent_work_id: parent.work_id, expected_parent_revision: parent.revision} : {})};
      const fingerprint = JSON.stringify(body); if (request.current?.fingerprint !== fingerprint) request.current = {fingerprint, key: newRequestKey()};
      const row = await service.generate(body, request.current.key);
      if (!current()) return;
      if (!row?.job_id) throw Object.assign(Error('生成请求未取得任务回执'), {code: 'KNOWLEDGE_RECEIPT_UNCONFIRMED'});
      setUnconfirmed(false); setReceipt(row); if (offset) setOffset(0); else works.reload();
    } catch (failure) {if (current()) {
      const terminal = generationFailureText(failure.code);
      const unknown = !terminal && (['NETWORK_ERROR', 'KNOWLEDGE_RECEIPT_UNCONFIRMED'].includes(failure.code) || failure.statusCode >= 500);
      setFailedGeneration(Boolean(terminal)); setUnconfirmed(unknown); setError(terminal || (unknown ? '生成响应尚未确认。先刷新作品查看；确认原请求将沿用同一次请求，不会重复创建。若持续返回相同错误，请联系管理员核对生成服务的执行结果。' : isGenerationInputError(failure) ? `本次未发起文档生成。${errorText(failure)}` : errorText(failure)));
    }}
    finally {flight.current = false; if (current()) setBusy(false);}
  };
  const download = async (work, file) => {if (!current()) return; setError(''); try {await openAuthorizedFile(service, {work_id: work.work_id, file_id: file.file_id}, false, current);} catch (failure) {if (current()) setError(errorText(failure));}};
  return <><LoadState loading={status.loading} error={status.error} onRetry={status.reload}><ProviderNotice value={status.value?.generation} label="材料生成" /></LoadState>
    {error && <Alert type={unconfirmed ? "warning" : "error"} title={error} />}
    {notice && <Alert type="success" showIcon title={notice} closable onClose={() => setNotice('')} />}
    <div className="kb122-two"><Panel title={parent ? '生成作品新版本' : '生成材料'} note="生成后需真实归档才可下载"><div className="kb122-stack">
      {available && <p className="pc-muted">{status.value.generation.message || '生成能力已配置，提交时验证连接与实际结果。'}</p>}
      {parent && <Alert type="info" title={`基于：${parent.title || parent.purpose || '已有作品'} · V${parent.version_no || 1}`} description="新版本重新按当前材料权限生成，默认仅作者可见；原版本与原共享范围保留。" action={<Button disabled={busy || unconfirmed || failedGeneration} onClick={resetGeneration}>改为新建作品</Button>} />}
      <SourcePicker service={service} values={sources} onChange={setSources} enabled={available && !busy && !readingParent && !unconfirmed && !failedGeneration} />
      <Input.TextArea aria-label="材料用途" rows={4} placeholder="说明用途、交付要求和需要回答的问题" value={purpose} onChange={event => setPurpose(event.target.value)} disabled={!available || busy || readingParent || unconfirmed || failedGeneration} />
      <Select aria-label="材料受众" value={audience} options={SCOPES} onChange={setAudience} disabled={!available || busy || readingParent || unconfirmed || failedGeneration} />
      <Select aria-label="生成格式" value={format} options={[{value: 'docx', label: 'DOCX', disabled: !enabledFormats.includes('docx')}, {value: 'pptx', label: 'PPTX（独立验收后开放）', disabled: !enabledFormats.includes('pptx')}]} onChange={setFormat} disabled={!available || busy || readingParent || unconfirmed || failedGeneration} />
      <Button type="primary" loading={busy || readingParent} disabled={!available || readingParent || failedGeneration || !enabledFormats.includes(format) || !sources.length || !purpose.trim()} onClick={generate}>{unconfirmed ? '确认原生成请求' : parent ? '提交生成新版本' : '提交生成任务'}</Button>
      {failedGeneration && <Button disabled={!available || busy || readingParent} onClick={prepareNewGeneration}>准备新的生成请求</Button>}
      {receipt && <Alert type="info" title={`已收到任务：${receipt.job_id}`} description={receipt.status === 'succeeded' ? '生成已完成，请在作品中核对归档文件。' : '请在我的作品刷新查看实际处理及归档结果。'} />}
    </div></Panel><Panel title="我的作品" note="本人生成及共享给我的作品" extra={<Button onClick={works.reload}>刷新作品</Button>}>
      <LoadState loading={works.loading} error={works.error} onRetry={works.reload}>{works.value?.items?.length ? <div className="kb122-stack">{works.value.items.map(work => <article className="kb122-work" key={work.work_id || work.job_id}>
        <h3>{work.title || work.purpose || '生成任务'}</h3><Tag2>{work.status === 'succeeded' && !work.files?.length ? '归档待确认' : ({queued: '排队中', running: '生成中', archiving: '文件归档中', succeeded: '已完成', failed: '生成失败'})[work.status] || '状态待确认'}</Tag2>
        {work.version_no && <span> · V{work.version_no}</span>}{work.error && <p className="pc-error">{work.error}</p>}
        {work.status === 'succeeded' && work.files?.length ? work.files.map(file => <Button key={file.file_id} onClick={() => download(work, file)}>下载 {file.filename || '作品'}</Button>) : work.status === 'succeeded' ? <p className="pc-error">产物归档信息不完整，暂不可下载。</p> : null}
        {work.can_manage === true ? <><Button onClick={() => {setNotice(''); setSharing(work.work_id);}}>管理作品共享</Button><Button disabled={!available || busy || readingParent || unconfirmed || failedGeneration || work.status !== 'succeeded'} onClick={() => nextVersion(work.work_id)}>生成新版本</Button></> : work.can_manage === false ? <Tag2>共享给我</Tag2> : null}
        {work.material_id && <Button onClick={() => onOpen(work.material_id)}>查看版本与共享</Button>}
        {(work.sources || []).map(source => <p key={`${source.material_id}:${source.version_id}`}>来源：<button className="pc-link" onClick={() => onOpen(source.material_id, source.version_id)}>{source.content_name || '来源资料'} · {source.version_no ? `V${source.version_no}` : '已锁定来源版本'}</button></p>)}
      </article>)}</div> : <Empty2 title="暂无作品" description="仅展示当前授权的真实任务与已归档文件。" />}</LoadState>
      {Number.isInteger(works.value?.total) && <Pagination current={offset / 20 + 1} pageSize={20} total={works.value.total} showSizeChanger={false} onChange={page => setOffset((page - 1) * 20)} />}
    </Panel></div>
    {sharing && <WorkShareDrawer key={`${actor}:${sharing}`} service={service} workId={sharing} onClose={() => setSharing(null)} onSaved={(_work, message) => {if (current()) {setSharing(null); setNotice(message); works.reload();}}} />}
  </>;
}
