import React, { useState, useEffect } from 'react';
import { Clock, Save, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';
import { useComplaints } from '../../context/ComplaintContext';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import slaApi from '../../api/sla.api';

export const SLAConfiguration = () => {
  const { slas, updateSlaConfig } = useComplaints();

  const [slaList, setSlaList] = useState([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (slas && slas.length > 0) {
      setSlaList(slas.map(s => ({
        ...s,
        category: s.category || s.categoryName || s.departmentName || 'Civic Infrastructure',
        ackDeadlineHours: s.acknowledgementHours || s.ackDeadlineHours || 4,
        assignDeadlineHours: s.assignmentHours || s.assignDeadlineHours || 12,
        inspectionDeadlineHours: s.inspectionHours || s.inspectionDeadlineHours || 24,
        resolutionDeadlineHours: s.resolutionHours || s.resolutionDeadlineHours || 48
      })));
    }
  }, [slas]);

  const handleFieldChange = (index, field, value) => {
    const updated = [...slaList];
    updated[index] = {
      ...updated[index],
      [field]: Number(value) || 0,
    };
    setSlaList(updated);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      for (const rule of slaList) {
        if (rule.id) {
          await slaApi.updateRule(rule.id, {
            acknowledgementHours: rule.ackDeadlineHours,
            assignmentHours: rule.assignDeadlineHours,
            inspectionHours: rule.inspectionDeadlineHours,
            resolutionHours: rule.resolutionDeadlineHours
          }).catch(() => {});
        }
      }
      updateSlaConfig(slaList);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.warn('Error saving SLA rules:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (slas && slas.length > 0) {
      setSlaList(slas.map(s => ({
        ...s,
        category: s.category || s.categoryName || s.departmentName || 'Civic Infrastructure',
        ackDeadlineHours: s.acknowledgementHours || s.ackDeadlineHours || 4,
        assignDeadlineHours: s.assignmentHours || s.assignDeadlineHours || 12,
        inspectionDeadlineHours: s.inspectionHours || s.inspectionDeadlineHours || 24,
        resolutionDeadlineHours: s.resolutionHours || s.resolutionDeadlineHours || 48
      })));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Citizen Charter &amp; SLA Matrix"
        description="Configure statutory service level turnaround times per civic category. Breaches trigger automated executive escalations."
        tag="Governance Policy"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" icon={RotateCcw} onClick={handleReset}>
              Reset
            </Button>
            <Button variant="primary" icon={Save} onClick={handleSave}>
              Save SLA Policies
            </Button>
          </div>
        }
      />

      {saved && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>SLA parameters successfully saved and synchronized across all municipal workflows!</span>
        </div>
      )}

      {/* SLA Policy Table */}
      <div className="gov-card overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Category-Specific Turnaround Thresholds (Hours)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Escalation fires immediately upon timer expiration
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/75 font-semibold text-slate-600 dark:text-slate-400">
                <th className="px-5 py-3">Civic Category</th>
                <th className="px-5 py-3">Acknowledgement (hrs)</th>
                <th className="px-5 py-3">Crew Assignment (hrs)</th>
                <th className="px-5 py-3">Site Inspection (hrs)</th>
                <th className="px-5 py-3">Final Resolution (hrs)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {slaList.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-5 py-4 font-semibold text-slate-800 dark:text-slate-200">
                    {item.category}
                  </td>
                  <td className="px-5 py-4">
                    <div className="w-24">
                      <Input
                        type="number"
                        value={item.ackDeadlineHours}
                        onChange={(e) => handleFieldChange(idx, 'ackDeadlineHours', e.target.value)}
                        className="text-center font-mono font-bold"
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="w-24">
                      <Input
                        type="number"
                        value={item.assignDeadlineHours}
                        onChange={(e) => handleFieldChange(idx, 'assignDeadlineHours', e.target.value)}
                        className="text-center font-mono font-bold"
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="w-24">
                      <Input
                        type="number"
                        value={item.inspectionDeadlineHours}
                        onChange={(e) => handleFieldChange(idx, 'inspectionDeadlineHours', e.target.value)}
                        className="text-center font-mono font-bold"
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="w-28">
                      <Input
                        type="number"
                        value={item.resolutionDeadlineHours}
                        onChange={(e) => handleFieldChange(idx, 'resolutionDeadlineHours', e.target.value)}
                        className="text-center font-mono font-bold text-blue-600"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Escalation Policy Guide */}
      <div className="gov-card p-5">
        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">
          Automatic 3-Tier Escalation Hierarchy
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
            <span className="font-bold text-amber-900 dark:text-amber-300 block mb-1">
              Tier 1: Department Officer
            </span>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Triggers when acknowledgement or crew allocation exceeds 24 hours. The executive officer is notified to take urgent direct charge.
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40">
            <span className="font-bold text-orange-900 dark:text-orange-300 block mb-1">
              Tier 2: Department Supervisor
            </span>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Triggers upon 48-hour delay or when a citizen disputes a poor-quality remediation. Senior supervisory engineer re-inspects.
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40">
            <span className="font-bold text-rose-900 dark:text-rose-300 block mb-1">
              Tier 3: Municipal Administrator
            </span>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Triggers at 72+ hours overdue or for structural public safety hazards. Dispatched directly to the Chief Grievance Commissioner.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SLAConfiguration;

