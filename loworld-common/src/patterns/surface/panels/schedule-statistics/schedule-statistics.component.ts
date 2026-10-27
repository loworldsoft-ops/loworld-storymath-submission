
import { LwButtonComponent } from '../../../../ui/form/button/button.component';
import { LwCardComponent } from '../../../../ui/data-display/card/card.component';
import { Component, input, computed, signal, ChangeDetectionStrategy } from '@angular/core';
import { LucideAngularModule, BarChart3, Calendar, Check, Circle, Clock3, ListTodo, Timer } from 'lucide-angular';
import { CalendarEvent, CalendarInfo } from '../../../../services/models/schedule.model';

type StatsPeriod = 'week' | 'month' | 'year';
type StatsTab = 'events' | 'tasks';

interface DateRange { start: Date; end: Date; }
interface BreakdownItem { id: string; name: string; color: string; value: number; percentage: number; }
interface DonutArc { color: string; dashArray: string; dashOffset: number; }
interface FocusDayItem { label: string; minutes: number; ratio: number; }
interface FocusTaskItem { title: string; minutes: number; ratio: number; }
interface FocusTick { value: number; y: number; }
interface FocusBar { label: string; minutes: number; x: number; y: number; width: number; height: number; }

function startOfWeek(d: Date): Date { const r = new Date(d); r.setHours(0,0,0,0); r.setDate(r.getDate()-r.getDay()); return r; }
function endOfWeek(d: Date): Date { const r = new Date(d); r.setHours(23,59,59,999); r.setDate(r.getDate()+(6-r.getDay())); return r; }
function startOfMonth(d: Date): Date { return new Date(d.getFullYear(),d.getMonth(),1,0,0,0,0); }
function endOfMonth(d: Date): Date { return new Date(d.getFullYear(),d.getMonth()+1,0,23,59,59,999); }
function startOfYear(d: Date): Date { return new Date(d.getFullYear(),0,1,0,0,0,0); }
function endOfYear(d: Date): Date { return new Date(d.getFullYear(),11,31,23,59,59,999); }
function isWithinInterval(d: Date, r: DateRange): boolean { return d>=r.start && d<=r.end; }
function diffMinutes(end: Date, start: Date): number { return Math.round((end.getTime()-start.getTime())/60000); }
function eachDay(r: DateRange): Date[] {
  const days: Date[] = [], cur = new Date(r.start), end = new Date(r.end);
  cur.setHours(0,0,0,0); end.setHours(0,0,0,0);
  while(cur<=end){ days.push(new Date(cur)); cur.setDate(cur.getDate()+1); } return days;
}
const KO_DOW = ['\uc77c','\uc6d4','\ud654','\uc218','\ubaa9','\uae08','\ud1a0'];
function fmtDate(d: Date, p: string): string {
  if(p==='E') return KO_DOW[d.getDay()];
  if(p==='M/d') return (d.getMonth()+1)+'/'+d.getDate();
  if(p==='yyyy-MM-dd') return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  if(p==='\uc6d4') return (d.getMonth()+1)+'\uc6d4';
  if(p==='yyyy\ub144 M\uc6d4') return d.getFullYear()+'\ub144 '+(d.getMonth()+1)+'\uc6d4';
  if(p==='yyyy\ub144') return d.getFullYear()+'\ub144';
  if(p==='M\uc6d4 d\uc77c') return (d.getMonth()+1)+'\uc6d4 '+d.getDate()+'\uc77c';
  return d.toLocaleDateString('ko-KR');
}

/**
 * 일정 수행 통계, 집중 시간 및 목표 달성률을 시각화하는 패널입니다.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'lw-schedule-statistics',
  standalone: true,
  imports: [LucideAngularModule, LwButtonComponent, LwCardComponent],
  templateUrl: './schedule-statistics.component.html',
  styleUrl: './schedule-statistics.component.scss',
})
export class LwScheduleStatisticsComponent {
  events       = input.required<CalendarEvent[]>();
  calendars    = input.required<CalendarInfo[]>();
  selectedDate = input<Date>(new Date());
readonly BarChart3Icon = BarChart3;
  readonly CalendarIcon  = Calendar;
  readonly Clock3Icon    = Clock3;
  readonly ListTodoIcon  = ListTodo;
  readonly CheckIcon     = Check;
  readonly CircleIcon    = Circle;
  readonly TimerIcon     = Timer;

  readonly activePeriod = signal<StatsPeriod>('month');
  readonly activeTab    = signal<StatsTab>('events');

  readonly periodOptions = [
    { key: 'week'  as const, label: '\uc774\ubc88 \uc8fc' },
    { key: 'month' as const, label: '\uc774\ubc88 \ub2ec' },
    { key: 'year'  as const, label: '\uc774\ubc88 \ub144' },
  ];

  readonly tabOptions = [
    { key: 'events' as const, label: '\uc77c\uc815',  icon: Calendar  },
    { key: 'tasks'  as const, label: '\ud560 \uc77c', icon: ListTodo  },
  ];

  readonly range = computed<DateRange>(() => {
    const d = this.selectedDate() instanceof Date ? this.selectedDate() : new Date(this.selectedDate() as any);
    switch (this.activePeriod()) {
      case 'week':  return { start: startOfWeek(d),  end: endOfWeek(d)  };
      case 'year':  return { start: startOfYear(d),  end: endOfYear(d)  };
      default:      return { start: startOfMonth(d), end: endOfMonth(d) };
    }
  });

  readonly rangeLabel = computed(() => {
    const d = this.selectedDate() instanceof Date ? this.selectedDate() : new Date(this.selectedDate() as any);
    const { start, end } = this.range();
    if (this.activePeriod() === 'week') return fmtDate(start,'M\uc6d4 d\uc77c') + ' \u2013 ' + fmtDate(end,'M\uc6d4 d\uc77c');
    if (this.activePeriod() === 'year') return fmtDate(d,'yyyy\ub144');
    return fmtDate(d,'yyyy\ub144 M\uc6d4');
  });

  private readonly inRange = computed(() => {
    const r = this.range();
    return this.events().filter(ev => {
      const d = ev.startDate instanceof Date ? ev.startDate : new Date(ev.startDate as any);
      return isWithinInterval(d, r);
    });
  });

  readonly eventEntries = computed(() => this.inRange().filter(ev => ev.type !== 'task'));
  readonly taskEntries  = computed(() => this.inRange().filter(ev => ev.type === 'task'));
  readonly eventCount   = computed(() => this.eventEntries().length);
  readonly allDayCount  = computed(() => this.eventEntries().filter(ev => ev.isAllDay).length);

  private readonly eventDurMins = computed(() =>
    this.eventEntries().filter(ev => !ev.isAllDay).reduce((t, ev) => {
      const s = ev.startDate instanceof Date ? ev.startDate : new Date(ev.startDate as any);
      const e = ev.endDate   instanceof Date ? ev.endDate   : new Date(ev.endDate   as any);
      return t + Math.max(diffMinutes(e, s), 0);
    }, 0)
  );
  readonly eventHours      = computed(() => Math.floor(this.eventDurMins()/60));
  readonly eventMinutesRem = computed(() => this.eventDurMins()%60);

  readonly calendarBreakdown = computed<BreakdownItem[]>(() => {
    const entries = this.eventEntries(), total = entries.length;
    return this.calendars().map(cal => {
      const value = entries.filter(ev => ev.calendarId === cal.id).length;
      return { id: cal.id, name: cal.name, color: cal.color, value,
               percentage: total > 0 ? Math.round((value/total)*100) : 0 };
    }).sort((a,b) => b.value - a.value);
  });

  readonly eventDonutArcs = computed(() =>
    this.buildArcs(this.calendarBreakdown().map(i=>({value:i.value,color:i.color})), 77.5, 3)
  );

  readonly taskCount       = computed(() => this.taskEntries().length);
  readonly completedCount  = computed(() => this.taskEntries().filter(t => t.isCompleted).length);
  readonly incompleteCount = computed(() => this.taskEntries().filter(t => !t.isCompleted).length);
  readonly completionRate  = computed(() => {
    const n = this.taskCount(); return n > 0 ? Math.round((this.completedCount()/n)*100) : 0;
  });

  readonly taskDonutArcs = computed(() =>
    this.buildArcs([
      { value: this.completedCount(),  color: '#10b981' },
      { value: this.incompleteCount(), color: '#e5e7eb' },
    ], 67.5, 2)
  );

  private readonly focusEntries   = computed(() => this.taskEntries().filter(t => (t.pomodoroMinutes ?? 0) > 0));
  private readonly totalFocusMins = computed(() => this.focusEntries().reduce((s,t) => s+(t.pomodoroMinutes??0), 0));
  readonly focusHours         = computed(() => Math.floor(this.totalFocusMins()/60));
  readonly focusMinsRem       = computed(() => this.totalFocusMins()%60);
  readonly totalFocusSessions = computed(() => this.focusEntries().length);
  readonly avgFocusMins       = computed(() =>
    this.totalFocusSessions() > 0 ? Math.round(this.totalFocusMins()/this.totalFocusSessions()) : 0
  );

  readonly focusByDay = computed<FocusDayItem[]>(() => {
    const entries = this.focusEntries(); if (!entries.length) return [];
    const map = new Map<string,number>();
    if (this.activePeriod() === 'year') {
      for (const t of entries) { const d = t.startDate instanceof Date?t.startDate:new Date(t.startDate as any); const k = fmtDate(d,'\uc6d4'); map.set(k,(map.get(k)??0)+(t.pomodoroMinutes??0)); }
    } else {
      for (const day of eachDay(this.range())) map.set(fmtDate(day,'yyyy-MM-dd'), 0);
      for (const t of entries) { const d = t.startDate instanceof Date?t.startDate:new Date(t.startDate as any); const k = fmtDate(d,'yyyy-MM-dd'); map.set(k,(map.get(k)??0)+(t.pomodoroMinutes??0)); }
    }
    const rows = Array.from(map.entries()).map(([k,minutes]) => ({
      label: this.activePeriod()==='week' ? fmtDate(new Date(k),'E') : this.activePeriod()==='month' ? fmtDate(new Date(k),'M/d') : k,
      minutes,
    })).filter(r => r.minutes > 0);
    const max = Math.max(...rows.map(r=>r.minutes), 0);
    return rows.map(r => ({...r, ratio: max>0 ? Math.max((r.minutes/max)*100, 6) : 0}));
  });

  private readonly chartMax = computed(() => this.niceMax(this.focusByDay().map(r=>r.minutes)));

  readonly focusChartTicks = computed<FocusTick[]>(() => {
    const max=this.chartMax(), top=20, bottom=228, h=bottom-top, n=4;
    return Array.from({length:n+1},(_,i)=>({ value: Math.round((max/n)*(n-i)), y: top+(h/n)*i }));
  });

  readonly focusBars = computed<FocusBar[]>(() => {
    const items=this.focusByDay(), max=this.chartMax(); if (!items.length||!max) return [];
    const top=20,bottom=228,left=62,right=726,h=bottom-top,w=right-left;
    const slot=w/items.length, bw=Math.min(28, Math.max(14, slot*0.4));
    return items.map((item,i) => {
      const height=Math.max((item.minutes/max)*h, 4);
      return { label:item.label, minutes:item.minutes, x:left+slot*i+(slot-bw)/2, y:bottom-height, width:bw, height };
    });
  });

  readonly topFocusTasks = computed<FocusTaskItem[]>(() => {
    const tot = new Map<string,number>();
    for (const t of this.focusEntries()) tot.set(t.title, (tot.get(t.title)??0)+(t.pomodoroMinutes??0));
    const rows = Array.from(tot.entries()).map(([title,minutes])=>({title,minutes}))
      .sort((a,b)=>b.minutes-a.minutes).slice(0,5);
    const maxMins = rows[0]?.minutes ?? 0;
    return rows.map(r => ({...r, ratio: maxMins>0 ? (r.minutes/maxMins)*100 : 0}));
  });

  topTaskColor(i: number): string {
    if (i===0) return 'var(--lw-cal-accent,#e74c3c)';
    if (i===1) return '#f97316'; if (i===2) return '#f59e0b'; return '#d1d5db';
  }

  private buildArcs(segs: Array<{value:number;color:string}>, r: number, gap: number): DonutArc[] {
    const nonZero = segs.filter(s=>s.value>0), total = nonZero.reduce((s,x)=>s+x.value,0);
    if (!total) return [];
    const circ = 2*Math.PI*r; let consumed = 0;
    return nonZero.map(s => {
      const angle=(s.value/total)*360, visible=Math.max(angle-gap,0), vLen=(visible/360)*circ;
      const arc = { color:s.color, dashArray:`${vLen} ${circ-vLen}`, dashOffset:-consumed };
      consumed += (angle/360)*circ; return arc;
    });
  }

  private niceMax(vals: number[]): number {
    const max = Math.max(...vals, 0);
    if (max<=0) return 20; if (max<=20) return 20;
    if (max<=50) return Math.ceil(max/10)*10;
    if (max<=200) return Math.ceil(max/25)*25;
    return Math.ceil(max/100)*100;
  }
}
