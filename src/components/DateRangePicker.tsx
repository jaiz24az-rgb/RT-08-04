import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Check, Clock } from 'lucide-react';

export interface DateRangePickerProps {
  startDate: string; // 'YYYY-MM-DD' or ''
  endDate: string;   // 'YYYY-MM-DD' or ''
  onChange: (startDate: string, endDate: string) => void;
  onApply?: (startDate: string, endDate: string) => void;
  placeholder?: string;
  allowClear?: boolean;
  align?: 'left' | 'right';
  showPresets?: boolean;
  className?: string;
  buttonClassName?: string;
  minYear?: number;
  maxYear?: number;
}

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Helper to format YYYY-MM-DD to Indonesian human readable date
function formatDateLabel(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  return `${day} ${MONTH_NAMES_SHORT[monthIdx] || parts[1]} ${year}`;
}

function toDateString(year: number, month: number, day: number): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onChange,
  onApply,
  placeholder = 'Pilih rentang tanggal...',
  allowClear = true,
  align = 'left',
  showPresets = true,
  className = '',
  buttonClassName = '',
  minYear = 2020,
  maxYear = 2035,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Temporary selection state while popup is open
  const [tempStart, setTempStart] = useState<string>(startDate || '');
  const [tempEnd, setTempEnd] = useState<string>(endDate || '');
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  // Navigation state for the left calendar (month: 0-11, year: YYYY)
  const initialDate = useMemo(() => {
    if (startDate) {
      const p = startDate.split('-');
      if (p.length === 3) {
        return { year: parseInt(p[0], 10), month: parseInt(p[1], 10) - 1 };
      }
    }
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  }, [startDate]);

  const [currentYear, setCurrentYear] = useState(initialDate.year);
  const [currentMonth, setCurrentMonth] = useState(initialDate.month);

  // Sync temp dates when props change or modal opens
  useEffect(() => {
    setTempStart(startDate || '');
    setTempEnd(endDate || '');
  }, [startDate, endDate, isOpen]);

  // Sync initial view when opening
  useEffect(() => {
    if (isOpen) {
      if (startDate) {
        const p = startDate.split('-');
        if (p.length === 3) {
          setCurrentYear(parseInt(p[0], 10));
          setCurrentMonth(parseInt(p[1], 10) - 1);
        }
      }
    }
  }, [isOpen, startDate]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Month 2 (Right calendar) is next month
  const month2Year = currentMonth === 11 ? currentYear + 1 : currentYear;
  const month2Month = currentMonth === 11 ? 0 : currentMonth + 1;

  // Calendar Day generator
  const getMonthMatrix = (year: number, month: number) => {
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const matrix: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isPrevMonth: boolean;
      isNextMonth: boolean;
    }> = [];

    // Previous month trailing days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      matrix.push({
        dateStr: toDateString(prevYear, prevMonth, day),
        dayNumber: day,
        isCurrentMonth: false,
        isPrevMonth: true,
        isNextMonth: false,
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      matrix.push({
        dateStr: toDateString(year, month, day),
        dayNumber: day,
        isCurrentMonth: true,
        isPrevMonth: false,
        isNextMonth: false,
      });
    }

    // Next month leading days to complete 6 weeks grid (42 days)
    const remaining = 42 - matrix.length;
    for (let day = 1; day <= remaining; day++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      matrix.push({
        dateStr: toDateString(nextYear, nextMonth, day),
        dayNumber: day,
        isCurrentMonth: false,
        isPrevMonth: false,
        isNextMonth: true,
      });
    }

    return matrix;
  };

  const matrix1 = useMemo(() => getMonthMatrix(currentYear, currentMonth), [currentYear, currentMonth]);
  const matrix2 = useMemo(() => getMonthMatrix(month2Year, month2Month), [month2Year, month2Month]);

  // Date selection logic
  const handleDateClick = (dateStr: string) => {
    if (!tempStart || (tempStart && tempEnd)) {
      // Starting new selection
      setTempStart(dateStr);
      setTempEnd('');
      setHoverDate(null);
    } else {
      // Second click finishes range
      if (dateStr < tempStart) {
        setTempStart(dateStr);
        setTempEnd(tempStart);
      } else {
        setTempEnd(dateStr);
      }
      setHoverDate(null);
    }
  };

  // Check if date is in range or selected
  const getDateStatus = (dateStr: string) => {
    const isStart = tempStart === dateStr;
    const isEnd = tempEnd === dateStr;
    
    // Effective end considering hover preview while selecting
    const effectiveEnd = tempEnd || (tempStart && hoverDate && hoverDate >= tempStart ? hoverDate : '');
    const effectiveStart = (tempStart && hoverDate && hoverDate < tempStart) ? hoverDate : tempStart;

    const isInRange = Boolean(
      effectiveStart && effectiveEnd && dateStr > effectiveStart && dateStr < effectiveEnd
    );

    const isHoverEnd = Boolean(!tempEnd && tempStart && hoverDate === dateStr);

    return {
      isStart,
      isEnd,
      isInRange,
      isHoverEnd,
      isRangeEndpoint: isStart || isEnd,
    };
  };

  // Quick preset helper
  const applyPreset = (preset: 'today' | 'last7' | 'last30' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'all') => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const d = now.getDate();

    if (preset === 'today') {
      const todayStr = toDateString(y, m, d);
      setTempStart(todayStr);
      setTempEnd(todayStr);
      setCurrentYear(y);
      setCurrentMonth(m);
    } else if (preset === 'last7') {
      const past = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      const startStr = toDateString(past.getFullYear(), past.getMonth(), past.getDate());
      const endStr = toDateString(y, m, d);
      setTempStart(startStr);
      setTempEnd(endStr);
      setCurrentYear(past.getFullYear());
      setCurrentMonth(past.getMonth());
    } else if (preset === 'last30') {
      const past = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
      const startStr = toDateString(past.getFullYear(), past.getMonth(), past.getDate());
      const endStr = toDateString(y, m, d);
      setTempStart(startStr);
      setTempEnd(endStr);
      setCurrentYear(past.getFullYear());
      setCurrentMonth(past.getMonth());
    } else if (preset === 'thisMonth') {
      const startStr = toDateString(y, m, 1);
      const lastDay = new Date(y, m + 1, 0).getDate();
      const endStr = toDateString(y, m, lastDay);
      setTempStart(startStr);
      setTempEnd(endStr);
      setCurrentYear(y);
      setCurrentMonth(m);
    } else if (preset === 'lastMonth') {
      const prevM = m === 0 ? 11 : m - 1;
      const prevY = m === 0 ? y - 1 : y;
      const startStr = toDateString(prevY, prevM, 1);
      const lastDay = new Date(prevY, prevM + 1, 0).getDate();
      const endStr = toDateString(prevY, prevM, lastDay);
      setTempStart(startStr);
      setTempEnd(endStr);
      setCurrentYear(prevY);
      setCurrentMonth(prevM);
    } else if (preset === 'thisYear') {
      const startStr = toDateString(y, 0, 1);
      const endStr = toDateString(y, 11, 31);
      setTempStart(startStr);
      setTempEnd(endStr);
      setCurrentYear(y);
      setCurrentMonth(0);
    } else if (preset === 'all') {
      setTempStart('');
      setTempEnd('');
    }
  };

  const handleApply = () => {
    let finalStart = tempStart;
    let finalEnd = tempEnd;

    // If only start date is selected, set end date = start date
    if (finalStart && !finalEnd) {
      finalEnd = finalStart;
    }

    onChange(finalStart, finalEnd);
    if (onApply) {
      onApply(finalStart, finalEnd);
    }
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempStart(startDate || '');
    setTempEnd(endDate || '');
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTempStart('');
    setTempEnd('');
    onChange('', '');
    if (onApply) {
      onApply('', '');
    }
  };

  // Render trigger display text
  const displayText = useMemo(() => {
    if (startDate && endDate) {
      if (startDate === endDate) {
        return formatDateLabel(startDate);
      }
      return `${formatDateLabel(startDate)} - ${formatDateLabel(endDate)}`;
    } else if (startDate) {
      return `Mulai ${formatDateLabel(startDate)}`;
    } else if (endDate) {
      return `Sampai ${formatDateLabel(endDate)}`;
    }
    return placeholder;
  }, [startDate, endDate, placeholder]);

  // Calculate day count
  const selectedDaysCount = useMemo(() => {
    if (tempStart && tempEnd) {
      const d1 = new Date(tempStart).getTime();
      const d2 = new Date(tempEnd).getTime();
      const diff = Math.round(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24)) + 1;
      return diff;
    } else if (tempStart) {
      return 1;
    }
    return 0;
  }, [tempStart, tempEnd]);

  const yearsOptions = useMemo(() => {
    const arr: number[] = [];
    for (let yr = minYear; yr <= maxYear; yr++) {
      arr.push(yr);
    }
    return arr;
  }, [minYear, maxYear]);

  // Calendar Single Month Renderer
  const renderCalendar = (
    year: number,
    month: number,
    matrix: Array<{ dateStr: string; dayNumber: number; isCurrentMonth: boolean }>,
    onMonthChange: (m: number) => void,
    onYearChange: (y: number) => void,
    isLeft: boolean
  ) => {
    return (
      <div className="w-full sm:w-[280px] p-2 select-none">
        {/* Month & Year Select Header */}
        <div className="flex items-center justify-between gap-1 mb-3 px-1">
          {isLeft ? (
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-7 hidden sm:block" />
          )}

          <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
            {/* Month select */}
            <div className="relative group">
              <select
                value={month}
                onChange={(e) => onMonthChange(parseInt(e.target.value, 10))}
                className="appearance-none bg-transparent hover:bg-slate-100 px-2 py-1 pr-5 rounded-md font-bold text-xs text-slate-900 cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                {MONTH_NAMES_EN.map((mName, idx) => (
                  <option key={mName} value={idx}>
                    {mName} ({MONTH_NAMES_SHORT[idx]})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">
                ▼
              </div>
            </div>

            {/* Year select */}
            <div className="relative group">
              <select
                value={year}
                onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
                className="appearance-none bg-transparent hover:bg-slate-100 px-2 py-1 pr-5 rounded-md font-bold text-xs text-slate-900 cursor-pointer focus:outline-none focus:ring-1 focus:ring-slate-400"
              >
                {yearsOptions.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500">
                ▼
              </div>
            </div>
          </div>

          {!isLeft ? (
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition cursor-pointer"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-7 hidden sm:block" />
          )}
        </div>

        {/* Week Days Header */}
        <div className="grid grid-cols-7 gap-0 text-center mb-1">
          {DAY_LABELS.map((day) => (
            <div
              key={day}
              className="h-8 flex items-center justify-center text-[11px] font-bold text-slate-800"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-0">
          {matrix.map((cell, idx) => {
            const { isStart, isEnd, isInRange, isHoverEnd } = getDateStatus(cell.dateStr);
            const isSingle = isStart && (tempEnd === tempStart || !tempEnd);

            return (
              <div
                key={idx}
                className="relative h-9 flex items-center justify-center"
                onMouseEnter={() => {
                  if (tempStart && !tempEnd) {
                    setHoverDate(cell.dateStr);
                  }
                }}
              >
                {/* Continuous Range Background Bar */}
                {isInRange && (
                  <div className="absolute inset-y-1 inset-x-0 bg-slate-100 z-0" />
                )}

                {/* Left connecting bar for End Date */}
                {isEnd && tempStart && tempStart !== tempEnd && (
                  <div className="absolute inset-y-1 left-0 right-1/2 bg-slate-100 z-0" />
                )}

                {/* Right connecting bar for Start Date */}
                {isStart && tempEnd && tempStart !== tempEnd && (
                  <div className="absolute inset-y-1 left-1/2 right-0 bg-slate-100 z-0" />
                )}

                {/* Date button */}
                <button
                  type="button"
                  onClick={() => handleDateClick(cell.dateStr)}
                  className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs transition cursor-pointer ${
                    isStart || isEnd
                      ? 'bg-slate-900 text-white font-extrabold shadow-sm'
                      : isHoverEnd
                      ? 'bg-slate-800 text-white font-bold'
                      : isInRange
                      ? 'text-slate-900 font-semibold'
                      : cell.isCurrentMonth
                      ? 'text-slate-800 hover:bg-slate-200/70 font-medium'
                      : 'text-slate-350 hover:bg-slate-100 font-normal'
                  }`}
                >
                  {cell.dayNumber}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 bg-white border border-slate-250 hover:border-slate-300 rounded-xl text-xs font-semibold text-slate-800 shadow-2xs transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-800 ${buttonClassName} ${
          isOpen ? 'ring-2 ring-slate-800 border-slate-800' : ''
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden text-left">
          <CalendarIcon className="w-4 h-4 text-slate-600 shrink-0" />
          <span className={`truncate ${!startDate && !endDate ? 'text-slate-400 font-normal' : 'text-slate-900 font-extrabold'}`}>
            {displayText}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {allowClear && (startDate || endDate) && (
            <span
              onClick={handleClear}
              className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-md transition cursor-pointer"
              title="Reset Tanggal"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </button>

      {/* Popover Calendar Container */}
      {isOpen && (
        <div
          className={`absolute top-full mt-2 z-50 bg-white border border-slate-200/90 rounded-3xl shadow-2xl p-4 sm:p-5 animate-in fade-in zoom-in-95 duration-150 ${
            align === 'right' ? 'right-0' : 'left-0'
          } max-w-[95vw] sm:max-w-none`}
          style={{ width: showPresets ? 'auto' : undefined }}
        >
          {/* Quick Presets row/bar */}
          {showPresets && (
            <div className="flex items-center gap-1.5 pb-3.5 mb-2 border-b border-slate-100 overflow-x-auto text-[11px] font-bold text-slate-600 min-w-max">
              <span className="text-[10px] uppercase text-slate-400 font-bold px-1">Pilihan Cepat:</span>
              <button
                type="button"
                onClick={() => applyPreset('today')}
                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg transition cursor-pointer"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => applyPreset('last7')}
                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg transition cursor-pointer"
              >
                7 Hari Terakhir
              </button>
              <button
                type="button"
                onClick={() => applyPreset('last30')}
                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg transition cursor-pointer"
              >
                30 Hari Terakhir
              </button>
              <button
                type="button"
                onClick={() => applyPreset('thisMonth')}
                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg transition cursor-pointer"
              >
                Bulan Ini
              </button>
              <button
                type="button"
                onClick={() => applyPreset('lastMonth')}
                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg transition cursor-pointer"
              >
                Bulan Lalu
              </button>
              <button
                type="button"
                onClick={() => applyPreset('thisYear')}
                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg transition cursor-pointer"
              >
                Tahun Ini
              </button>
              <button
                type="button"
                onClick={() => applyPreset('all')}
                className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg transition cursor-pointer"
              >
                Semua Data
              </button>
            </div>
          )}

          {/* Dual Calendar layout */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-center gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
            {/* Month 1 */}
            {renderCalendar(
              currentYear,
              currentMonth,
              matrix1,
              (m) => setCurrentMonth(m),
              (y) => setCurrentYear(y),
              true
            )}

            {/* Month 2 */}
            <div className="pt-3 sm:pt-0 sm:pl-6 w-full sm:w-auto">
              {renderCalendar(
                month2Year,
                month2Month,
                matrix2,
                (m) => {
                  if (m === 0) {
                    setCurrentMonth(11);
                    setCurrentYear(month2Year - 1);
                  } else {
                    setCurrentMonth(m - 1);
                    setCurrentYear(month2Year);
                  }
                },
                (y) => {
                  if (month2Month === 0) {
                    setCurrentYear(y - 1);
                  } else {
                    setCurrentYear(y);
                  }
                },
                false
              )}
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Selected Range Summary Info */}
            <div className="text-xs text-slate-600 font-medium text-center sm:text-left">
              {tempStart ? (
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-slate-900">
                    {formatDateLabel(tempStart)}
                  </span>
                  {tempEnd && tempEnd !== tempStart && (
                    <>
                      <span className="text-slate-400">→</span>
                      <span className="font-extrabold text-slate-900">
                        {formatDateLabel(tempEnd)}
                      </span>
                    </>
                  )}
                  {selectedDaysCount > 0 && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-full ml-1">
                      {selectedDaysCount} Hari
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-slate-400 italic">Silakan klik tanggal awal dan akhir di kalender</span>
              )}
            </div>

            {/* Cancel and Apply Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleApply}
                className="flex-1 sm:flex-none px-5 py-2 bg-slate-900 hover:bg-black text-white font-extrabold text-xs rounded-xl shadow-xs transition cursor-pointer active:scale-97"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
