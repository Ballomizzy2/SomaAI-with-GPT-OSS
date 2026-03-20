'use client';

import { useEffect, useState } from 'react';
import { getSession, getPainTrend, getExerciseStats } from '../lib/sessionStorage';

interface ProgressDashboardProps {
  embedded?: boolean;
  persistent?: boolean;
}

export default function ProgressDashboard({ embedded, persistent = false }: ProgressDashboardProps) {
  const [isOpen, setIsOpen] = useState(persistent);
  const [painTrend, setPainTrend] = useState<{ timestamp: number; severity: number }[]>([]);
  const [exerciseStats, setExerciseStats] = useState({
    total: 0,
    completed: 0,
    adherenceRate: 0,
    streak: 0
  });
  const [sessionInfo, setSessionInfo] = useState({
    totalLogs: 0,
    daysSinceStart: 0
  });

  useEffect(() => {
    if (persistent) {
      setIsOpen(true);
    }
  }, [persistent]);

  useEffect(() => {
    loadData();

    const handleSessionUpdate = () => {
      loadData();
    };

    window.addEventListener('soma_session_updated', handleSessionUpdate);

    const interval = setInterval(() => {
      if (isOpen) loadData();
    }, 10000);

    return () => {
      window.removeEventListener('soma_session_updated', handleSessionUpdate);
      clearInterval(interval);
    };
  }, [isOpen]);

  const loadData = () => {
    const trend = getPainTrend();
    const stats = getExerciseStats();
    const session = getSession();

    setPainTrend(trend);
    setExerciseStats(stats);

    const daysSinceStart = Math.floor(
      (Date.now() - session.startedAt) / (24 * 60 * 60 * 1000)
    );

    setSessionInfo({
      totalLogs: session.painLogs.length,
      daysSinceStart: daysSinceStart || 0
    });
  };

  const getAveragePain = () => {
    if (painTrend.length === 0) return '—';
    const sum = painTrend.reduce((acc, curr) => acc + curr.severity, 0);
    return (sum / painTrend.length).toFixed(1);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => {
          loadData();
          setIsOpen(true);
        }}
        className={`tracker-trigger ${embedded ? 'tracker-trigger-embedded' : ''}`}
        title="View your progress"
      >
        Your Progress
      </button>
    );
  }

  return (
    <div className={`tracker-panel ${embedded ? 'tracker-panel-embedded' : ''}`}>
      <header className="tracker-header">
        <div>
          <h3 className="tracker-title">Your Progress</h3>
          <p className="tracker-subtitle">
            {sessionInfo.daysSinceStart > 0
              ? `Day ${sessionInfo.daysSinceStart + 1}`
              : 'Getting started'}
          </p>
        </div>
        {!persistent && (
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="tracker-close"
            aria-label="Close"
          >
            ×
          </button>
        )}
      </header>

      <div className="tracker-body">
        <div className="tracker-stats">
          <div className="tracker-stat">
            <span className="tracker-stat-value">{getAveragePain()}</span>
            <span className="tracker-stat-label">Avg Pain (7d)</span>
          </div>
          <div className="tracker-stat">
            <span className="tracker-stat-value">{exerciseStats.streak}</span>
            <span className="tracker-stat-label">Day Streak</span>
          </div>
        </div>

        {painTrend.length > 0 && (
          <div className="tracker-section">
            <h4 className="tracker-section-title">Pain Trend</h4>
            <div className="tracker-chart">
              {painTrend.slice(-7).map((point, idx) => {
                const heightPercent = (point.severity / 10) * 100;
                return (
                  <div key={idx} className="tracker-chart-bar-wrap">
                    <span className="tracker-chart-value">{point.severity}</span>
                    <div
                      className="tracker-chart-bar"
                      style={{
                        height: `${heightPercent}%`,
                        minHeight: point.severity === 0 ? 2 : 8
                      }}
                    />
                    <span className="tracker-chart-date">{formatDate(point.timestamp)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {painTrend.length === 0 && (
          <p className="tracker-empty">
            No pain logs yet. Start tracking your pain to see trends.
          </p>
        )}

        <div className="tracker-section">
          <h4 className="tracker-section-title">Exercise Adherence</h4>
          <div className="tracker-adherence">
            <div className="tracker-adherence-row">
              <span>Completed</span>
              <span className="tracker-adherence-count">
                {exerciseStats.completed} / {exerciseStats.total}
              </span>
            </div>
            <div className="tracker-adherence-bar">
              <div
                className="tracker-adherence-fill"
                style={{ width: `${exerciseStats.adherenceRate}%` }}
              />
            </div>
            <p className="tracker-adherence-pct">{exerciseStats.adherenceRate}% adherence</p>
          </div>
        </div>

        <div className="tracker-summary">
          <strong>Keep going.</strong>{' '}
          {sessionInfo.totalLogs > 0
            ? `You've logged ${sessionInfo.totalLogs} pain report${sessionInfo.totalLogs === 1 ? '' : 's'}.`
            : 'Start logging your pain to track progress.'}
          {exerciseStats.streak > 0 && ` ${exerciseStats.streak}-day streak.`}
        </div>
      </div>
    </div>
  );
}
