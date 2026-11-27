import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataService } from '../../services/dataService';
import { Application } from '../../types';
import { StatusBadge, OfferStatusBadge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  FileCheck2,
  Calendar,
  History,
  AlertCircle,
  PartyPopper,
  CheckCircle2,
  XCircle,
  Award,
} from 'lucide-react';

export const StudentApplications: React.FC = () => {
  const { studentProfile, updateProfile } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [respondingAppId, setRespondingAppId] = useState<string | null>(null);
  const [offerFeedback, setOfferFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchApps = async () => {
    if (studentProfile) {
      const apps = await dataService.getStudentApplications(studentProfile.id);
      setApplications(apps);
    }
  };

  useEffect(() => {
    fetchApps();
  }, [studentProfile]);

  const handleOfferDecision = async (app: Application, decision: 'Accepted' | 'Declined') => {
    setOfferFeedback(null);
    setRespondingAppId(app.id);
    const res = await dataService.respondToOffer(app.id, decision);
    setRespondingAppId(null);

    if (res.success) {
      await fetchApps();
      if (decision === 'Accepted' && studentProfile) {
        // Trigger a harmless profile refresh so StudentDashboard placement banner updates
        await updateProfile({});
      }
      setOfferFeedback({ type: 'success', text: res.message });
    } else {
      setOfferFeedback({ type: 'error', text: res.message });
    }
  };

  const filteredApps = applications.filter((app) => {
    if (selectedStatus === 'All') return true;
    return app.status === selectedStatus;
  });

  const handleOpenHistory = (app: Application) => {
    setSelectedApp(app);
    setIsHistoryModalOpen(true);
  };

  const statusCategories: { label: string; value: string }[] = [
    { label: 'All Applications', value: 'All' },
    { label: 'Applied', value: 'Applied' },
    { label: 'Under Review', value: 'Under Review' },
    { label: 'Shortlisted', value: 'Shortlisted' },
    { label: 'Interview Scheduled', value: 'Interview Scheduled' },
    { label: 'Selected / Offers', value: 'Selected' },
    { label: 'Not Shortlisted', value: 'Rejected' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Application History & Status Tracker
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Track the live progression of your applications through recruiter review, coding rounds, interviews, and final offers.
        </p>
      </div>

      {offerFeedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
            offerFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            {offerFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{offerFeedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setOfferFeedback(null)}
            className="font-bold opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {statusCategories.map((cat) => {
          const count =
            cat.value === 'All'
              ? applications.length
              : applications.filter((a) => a.status === cat.value).length;

          return (
            <button
              key={cat.value}
              onClick={() => setSelectedStatus(cat.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                selectedStatus === cat.value
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  selectedStatus === cat.value ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Applications Cards List */}
      {filteredApps.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 space-y-3">
          <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No applications in this category</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            You currently have no applications matching this filter status.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app) => (
            <div
              key={app.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-indigo-200 transition space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={app.job?.company?.logo_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=64'}
                    alt={app.job?.company?.name}
                    className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-100 shrink-0"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-500">{app.job?.company?.name}</span>
                    <h3 className="text-base font-bold text-slate-900">{app.job?.title}</h3>
                    <p className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-0.5 font-medium">
                      <span>Package: ₹{app.job?.salary_min_lpa} - ₹{app.job?.salary_max_lpa} LPA</span>
                      <span>•</span>
                      <span>Applied on {new Date(app.applied_at).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <StatusBadge status={app.status} />
                    {app.offer_status && <OfferStatusBadge status={app.offer_status} />}
                  </div>
                  <button
                    onClick={() => handleOpenHistory(app)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    <History className="w-3.5 h-3.5" /> View Timeline & History
                  </button>
                </div>
              </div>

              {/* Status Specific Banners */}
              {app.status === 'Selected' && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <PartyPopper className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-2">
                          <span>
                            {app.offer_status
                              ? 'Official Placement Offer Extended!'
                              : 'Congratulations! You have been Selected'}
                          </span>
                          {app.offer_status && <OfferStatusBadge status={app.offer_status} />}
                        </h4>
                        <p className="text-xs text-emerald-800 mt-0.5">
                          {app.offer_status ? (
                            <>
                              <strong>{app.job?.company?.name}</strong> has extended an offer for{' '}
                              <strong>{app.job?.title}</strong>
                              {app.offer_package_lpa !== undefined && (
                                <> at <strong>₹{app.offer_package_lpa} LPA</strong></>
                              )}
                              {app.offer_date && <> (Offer Date: {app.offer_date})</>}.
                            </>
                          ) : (
                            <>
                              You have been selected by recruiters. The Placement Office will issue your formal offer details shortly.
                            </>
                          )}
                        </p>
                        {app.offer_details && (
                          <p className="text-xs text-emerald-900 bg-white/70 px-3 py-2 rounded-lg border border-emerald-200/70 mt-2">
                            <Award className="w-3.5 h-3.5 inline mr-1 text-emerald-600" />
                            {app.offer_details}
                          </p>
                        )}
                        {app.notes && !app.offer_details && (
                          <p className="text-xs text-emerald-800 mt-1">
                            Notes: &quot;{app.notes}&quot;
                          </p>
                        )}
                      </div>
                    </div>

                    {app.offer_status === 'Pending' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={respondingAppId === app.id}
                          onClick={() => handleOfferDecision(app, 'Accepted')}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Accept Offer
                        </button>
                        <button
                          type="button"
                          disabled={respondingAppId === app.id}
                          onClick={() => handleOfferDecision(app, 'Declined')}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {app.status === 'Interview Scheduled' && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-6 h-6 text-amber-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-amber-950">
                        Technical Interview Scheduled
                      </h4>
                      <p className="text-xs text-amber-800">
                        Date:{' '}
                        <strong>
                          {app.interview_date
                            ? new Date(app.interview_date).toLocaleString()
                            : 'To be notified by T&P cell'}
                        </strong>
                        {app.notes && <span> • Remarks: {app.notes}</span>}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {app.status === 'Shortlisted' && (
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center gap-3 text-xs text-indigo-900">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    Your profile and test scores have been shortlisted for the subsequent rounds.
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Status History Timeline Modal */}
      {selectedApp && (
        <Modal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          title={`Application Timeline - ${selectedApp.job?.title}`}
          maxWidth="lg"
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
              <span className="font-bold text-slate-700">{selectedApp.job?.company?.name}</span>
              <StatusBadge status={selectedApp.status} />
            </div>

            {/* Vertical Timeline */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {selectedApp.status_history && selectedApp.status_history.length > 0 ? (
                selectedApp.status_history.map((sh, idx) => (
                  <div key={sh.id || idx} className="relative">
                    {/* Bullet */}
                    <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-indigo-600 border-2 border-white ring-2 ring-indigo-100" />
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{sh.status}</span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(sh.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        {sh.notes || 'Status updated in placement tracking system.'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500">
                  Application registered in database on{' '}
                  {new Date(selectedApp.applied_at).toLocaleString()}.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Close Timeline
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
