"use client";

import { motion } from "framer-motion";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from "date-fns";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

type MissionHistory = {
  date: string;
  status: "completed" | "failed" | "pending";
};

export function CalendarGrid({ 
  missions, 
  currentStreak, 
  longestStreak 
}: { 
  missions: MissionHistory[],
  currentStreak: number,
  longestStreak: number
}) {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add padding for start of month (assuming Sunday is 0)
  const startDayOfWeek = monthStart.getDay();
  const paddingDays = Array.from({ length: startDayOfWeek }).map((_, i) => i);

  return (
    <div className="space-y-8">
      {/* Top Stats */}
      <div className="gm-card grid grid-cols-2 gap-4">
        <div>
          <span className="text-steel uppercase text-sm font-semibold tracking-wider block mb-1">Current Streak</span>
          <span className="text-signal text-5xl font-bold flex items-center gap-2">
            {currentStreak} <span className="text-xl text-bone">🔥</span>
          </span>
        </div>
        <div className="text-right">
          <span className="text-steel uppercase text-sm font-semibold tracking-wider block mb-1">Longest</span>
          <span className="text-bone text-3xl font-bold">{longestStreak}</span>
        </div>
      </div>

      {/* Calendar */}
      <div className="gm-card">
        <h2 className="text-xl font-semibold text-bone mb-6 text-center">
          {format(today, "MMMM yyyy")}
        </h2>
        
        {/* Days Header */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-medium text-steel uppercase tracking-wider">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2">
          {paddingDays.map(i => (
            <div key={`padding-${i}`} className="h-10 sm:h-14 rounded-lg bg-transparent" />
          ))}

          {daysInMonth.map((day, i) => {
            const mission = missions.find(m => isSameDay(new Date(m.date), day));
            const isFuture = day > today;
            const status = mission?.status;

            let bgClass = "bg-surface-2 border border-border/50";
            let textClass = "text-slate";
            
            if (status === "completed") {
              bgClass = "bg-deep-green/20 border-signal/50";
              textClass = "text-signal font-bold shadow-glow-sm";
            } else if (status === "failed") {
              bgClass = "bg-red-500/10 border-red-500/30";
              textClass = "text-red-400";
            } else if (isToday(day)) {
              bgClass = "bg-surface border-signal";
              textClass = "text-bone font-bold";
            } else if (isFuture) {
              bgClass = "bg-surface/30 border-border/20 opacity-50";
              textClass = "text-steel";
            }

            return (
              <motion.div
                key={day.toISOString()}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.02 }}
                className={cn(
                  "h-10 sm:h-14 flex items-center justify-center rounded-lg transition-colors relative group",
                  bgClass, textClass
                )}
              >
                {format(day, "d")}
                
                {status === "completed" && (
                  <motion.div 
                    className="absolute -top-1 -right-1 text-xs"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + (i * 0.02) }}
                  >
                    🔥
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
