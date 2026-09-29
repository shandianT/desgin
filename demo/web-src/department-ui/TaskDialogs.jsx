import React, { useLayoutEffect, useRef, useState } from 'react';
import { Button, Checkbox, Input, Modal, Space } from 'antd';
import { SbField, SbSelect, SbStatePanel, SbTextarea } from '@shandiant/ui-react';
import personPickerLogic from '../business/utils/personPicker.js';

const {normalizeTeams, normalizeMembers, candidateTeam, validSelection, filterMembers} = personPickerLogic;

// Present the shared business components using the existing Web controls.
export function PersonPicker({ picker, invokeOn }) {
  if (!picker) return null;
  const d = picker.data, p = picker.properties;
  const call = (name, payload = {}) => invokeOn(picker, name, payload);
  return <PersonPickerView data={d} properties={p} call={call} />;
}

// Other Web pages can use this controlled adapter without creating a native child.
// Candidate teams filter the list only; scope changes are committed by onConfirm.
export function ControlledPersonPicker({open, title = '选择成员', members = [], teams = [], defaultTeamId = '', selectedIds = [], multiple = false, allowAll = false, allLabel = '全部成员', maxSelected = 100, loading = false, error = '', onConfirm, onClose, onRetry}) {
  const initial = () => ({query: '', teamId: candidateTeam(teams, defaultTeamId), draft: [...new Set(selectedIds.map(String))], touched: false, invalid: false, error: ''});
  const [state, setState] = useState(initial), wasOpen = useRef(false);
  useLayoutEffect(() => {if (open && !wasOpen.current) setState(initial()); wasOpen.current = open;}, [open]);
  const teamRows = normalizeTeams(teams), people = normalizeMembers(members, teamRows);
  const teamId = candidateTeam(teamRows, state.touched ? state.teamId : defaultTeamId);
  const draft = loading ? state.draft : validSelection(state.draft, people, multiple, maxSelected);
  const invalid = state.invalid || draft.length !== state.draft.length;
  useLayoutEffect(() => {if (invalid && !state.invalid) setState(value => ({...value, invalid: true}));}, [invalid, state.invalid]);
  const d = {query: state.query, teamId, teamRows, draft,
    rows: filterMembers(people, teamId, state.query).map(row => ({...row, checked: draft.includes(row.id)})),
    selectedRows: people.filter(row => draft.includes(row.id)),
    selectionError: invalid ? `部分已选人员已不可用，请重新选择${allowAll ? '或明确选择全部' : ''}` : state.error,
    canConfirm: !invalid && !loading && !error && (draft.length > 0 || allowAll)};
  const call = (name, {dataset = {}, detail = {}} = {}) => {
    if (name === 'close') return onClose?.();
    if (name === 'retry') return onRetry?.();
    if (name === 'confirm') {if (open && d.canConfirm) onConfirm?.({ids: draft.slice(), teamId}); return;}
    if (name === 'search') return setState(value => ({...value, query: detail.value, error: ''}));
    if (name === 'chooseTeam') return setState(value => ({...value, teamId: candidateTeam(teamRows, dataset.id), touched: true, error: ''}));
    if (loading || error) return;
    if (name === 'chooseAll' && allowAll) return setState(value => ({...value, draft: [], invalid: false, error: ''}));
    if (name === 'toggle' && people.some(row => row.id === String(dataset.id))) {
      const id = String(dataset.id);
      let next = multiple ? draft.includes(id) ? draft.filter(value => value !== id) : [...draft, id] : [id];
      if (next.length > maxSelected) return setState(value => ({...value, error: `最多选择 ${maxSelected} 人`}));
      setState(value => ({...value, draft: next, invalid: false, error: ''}));
    }
  };
  return <PersonPickerView data={d} properties={{open, title, multiple, allowAll, allLabel, loading, error}} call={call} />;
}

function PersonPickerView({data: d, properties: p, call}) {
  return <Modal rootClassName="department-ui department-task-choice-modal" title={p.title || '选择成员'} open={Boolean(p.open)} onCancel={() => call('close')} destroyOnHidden
    footer={<Space><Button onClick={() => call('close')}>取消</Button><Button type="primary" disabled={!d.canConfirm} onClick={() => call('confirm')}>确定{p.multiple && d.draft?.length ? `（${d.draft.length} 人）` : ''}</Button></Space>}>
    <SbField label="团队"><SbSelect aria-label="筛选团队" value={d.teamId || ''} disabled={p.loading} options={[{value: '', label: '全部团队'}, ...(d.teamRows || []).map(team => ({value: team.id, label: team.name}))]} onChange={id => call('chooseTeam', {dataset: {id}})} /></SbField>
    <Input aria-label="搜索姓名或账号" value={d.query || ''} allowClear placeholder="搜索姓名、账号或团队" onChange={event => call('search', {detail: {value: event.target.value}})} />
    {d.selectedRows?.length > 0 && <p className="ds-muted" aria-live="polite">已选：{d.selectedRows.map(row => row.name).join('、')}</p>}
    {d.selectionError && <p className="ds-td-error" role="alert">{d.selectionError}</p>}
    <div className="department-task-choice-results">
      {p.allowAll && <Button disabled={p.loading || Boolean(p.error)} onClick={() => call('chooseAll')}>{p.allLabel || '全部成员'}</Button>}
      {!p.loading && !p.error && (d.rows || []).map(row => <div key={row.id} className="department-task-selector-row">
        <Checkbox checked={Boolean(row.checked)} onChange={() => call('toggle', {dataset: {id: row.id}})}>{row.name} · {row.account_code || '账号未登记'}</Checkbox><span>{row.teamLabel || '未填写团队'}</span>
      </div>)}
      <SbStatePanel state={p.error ? 'error' : p.loading ? 'loading' : !d.rows?.length ? 'empty' : 'normal'} description={p.error || '没有匹配人员，请调整团队或搜索条件。'} onRetry={() => call('retry')} />
    </div>
  </Modal>;
}

export function TaskCancelDialog({ dialog, invokeOn }) {
  if (!dialog) return null;
  const d = dialog.data, p = dialog.properties;
  const call = (name, payload = {}) => invokeOn(dialog, name, payload);
  const busy = Boolean(d.loading || d.submitting || d.confirming);
  return <Modal rootClassName="department-ui department-task-choice-modal" title="取消任务" open={Boolean(p.open)} onCancel={() => call('close')} destroyOnHidden
    footer={<Space><Button onClick={() => call('close')}>返回</Button>{d.needsRefresh && <Button loading={d.loading} disabled={d.submitting || d.confirming} onClick={() => call('refresh')}>刷新任务状态</Button>}<Button danger type="primary" loading={d.submitting} disabled={busy || !d.canSubmit || d.needsRefresh} onClick={() => call('submit')}>确认取消</Button></Space>}>
    {d.loading ? <SbStatePanel state="loading" title="正在读取任务最新状态" /> : <>
      {d.task && <p>{d.task.title || d.task.description || '当前任务'}</p>}
      <p className="ds-muted">取消不会计为完成。任务、取消原因和历史记录仍可在“已结束”中查看。</p>
      <SbField label="取消原因" required error={d.error}><SbTextarea aria-label="取消原因" value={d.note || ''} disabled={busy} maxLength={500} autoSize={{minRows: 4, maxRows: 8}} placeholder="请说明取消原因，保留处理依据" onChange={value => call('inputNote', {detail: {value}})} /></SbField>
    </>}
  </Modal>;
}
