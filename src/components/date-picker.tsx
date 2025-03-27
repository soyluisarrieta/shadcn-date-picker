import * as React from 'react'
import { CalendarIcon, ChevronDown, ChevronDownIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  format,
  addMonths,
  subMonths,
  setMonth,
  setYear,
  getDaysInMonth,
  startOfMonth,
  getDay,
  isToday,
  isSameDay,
  isAfter,
  endOfDay,
  startOfDay,
  isWithinInterval
} from 'date-fns'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  { name: 'Jan', full: 'January' },
  { name: 'Feb', full: 'February' },
  { name: 'Mar', full: 'March' },
  { name: 'Apr', full: 'April' },
  { name: 'May', full: 'May' },
  { name: 'Jun', full: 'June' },
  { name: 'Jul', full: 'July' },
  { name: 'Aug', full: 'August' },
  { name: 'Sep', full: 'September' },
  { name: 'Oct', full: 'October' },
  { name: 'Nov', full: 'November' },
  { name: 'Dec', full: 'December' }
]

enum Modes {
  Duo = 'duo',
  Single = 'single',
  Range = 'range'
}

export type DatePickerModes =  `${Modes}`
export type DateRangeValue = { from?: Date, to?: Date }
export type DateValue = Date | DateRangeValue

type DatePickerRange = {
  mode?: `${Modes.Range}`
  defaultValue?: DateRangeValue
  value?: DateRangeValue
  onValueChange?: (date: DateRangeValue | undefined) => void
}

type DatePickerSingle = {
  mode?: `${Modes.Single}`
  defaultValue?: Date
  value?: Date
  onValueChange?: (date: Date | undefined) => void
}

type DatePickerDuo = {
  mode?: `${Modes.Duo}`
  defaultValue?: DateValue
  value?: DateValue
  onValueChange?: (date: DateValue | undefined) => void
}

type DatePickerBase = {
  className?: string
  onReset?: () => void
  placeholder?: string
  onModeChange?: (mode: `${Modes}`) => void,
  align?: 'start' | 'center' | 'end';
}

function DatePickerTrigger ({
  placeholder,
  className,
  selectedDate,
  rangeStart,
  rangeEnd,
  isRangeMode
}: {
  placeholder?: string,
  className?: string
  selectedDate?: Date,
  rangeStart?: Date,
  rangeEnd?: Date,
  isRangeMode?: boolean
}) {
  const formatDisplayText = () => {
    const placeholderText = placeholder ? placeholder : `Pick a ${isRangeMode ? 'date range' : 'date'}`
    if (!isRangeMode) {
      return selectedDate ? format(selectedDate ? selectedDate : new Date(), 'PPP') : placeholderText
    } else if (isRangeMode) {
      if (rangeStart && rangeEnd) {
        return `${format(rangeStart, 'PP')} - ${format(rangeEnd, 'PP')}`
      } else if (rangeStart) {
        return `${format(rangeStart, 'PP')} - ?`
      } else {
        return placeholderText
      }
    }
  }
  return (
    <Button
      variant="outline"
      className={cn(
        'w-auto min-w-[180px] justify-start text-left font-normal',
        (!isRangeMode && !selectedDate) || (isRangeMode && !rangeStart) ? 'text-muted-foreground' : '',
        className
      )}
      asChild
    >
      <PopoverTrigger>
        <span className="flex-1">{formatDisplayText()}</span>
        <CalendarIcon className="ml-2 h-4 w-4 text-muted-foreground" />
      </PopoverTrigger>
    </Button>
  )
}

function DatePickerHeader ({
  currentMonth,
  view,
  setView,
  previousMonth,
  nextMonth
}: {
  currentMonth: Date;
  view: 'days' | 'years';
  setView: (view: 'days' | 'years') => void;
  previousMonth: () => void;
  nextMonth: () => void;
}) {
  return (
    <div className="flex items-center justify-between pb-1">
      <Button
        variant="ghost"
        className="text-sm font-medium flex items-center data-[state=open]:text-muted-foreground/80 [&[data-state=open]>svg]:rotate-180"
        onClick={() => setView(view === 'days' ? 'years' : 'days')}
        data-state={view === 'years' ? 'open' : 'closed'}
      >
        {format(currentMonth ? currentMonth : new Date(), 'MMMM yyyy')}
        <ChevronDown className="ml-1 h-4 w-4 transition-transform duration-200" />
      </Button>
      <div className="flex items-center">
        <Button variant="ghost" className="h-8 w-8 p-0" onClick={previousMonth}>
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous month</span>
        </Button>
        <Button variant="ghost" className="h-8 w-8 p-0" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next month</span>
        </Button>
      </div>
    </div>
  )
}

function DatePickerWeekDays () {
  return (
    <div className="grid grid-cols-7 gap-1 text-center text-xs">
      {DAY_NAMES.map((day) => (
        <div key={day} className="py-1 font-medium">
          {day}
        </div>
      ))}
    </div>
  )
}

function DatePickerGridDays ({
  selectedDate,
  currentMonth,
  isRangeMode,
  rangeStart,
  rangeEnd,
  rangeHover,
  handleSelect,
  handleDayHover
}: {
  selectedDate?: Date;
  currentMonth: Date;
  isRangeMode?: boolean;
  rangeStart?: Date;
  rangeEnd?: Date;
  rangeHover?: Date;
  handleSelect: (date: Date) => void;
  handleDayHover: (date: Date) => void;
}) {
  // Get the days of the month
  const calendarDays = React.useMemo(() => {
    const daysInMonth = getDaysInMonth(currentMonth ? currentMonth : new Date())
    const startDay = getDay(startOfMonth(currentMonth ? currentMonth : new Date()))
    const days = []

    for (let i = 0; i < startDay; i++) {
      days.push(null)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const year = currentMonth ? currentMonth.getFullYear() : new Date().getFullYear()
      const month = currentMonth ? currentMonth.getMonth() : new Date().getMonth()
      days.push(new Date(year, month, day))
    }

    return days
  }, [currentMonth])

  // Check if a date is within the range
  const isInRange = (day: Date) => {
    if (!isRangeMode || !day) return false

    if (rangeStart && rangeEnd) {
      return isWithinInterval(day, {
        start: startOfDay(rangeStart),
        end: endOfDay(rangeEnd)
      })
    }

    if (rangeStart && rangeHover) {
      const isHoverAfterStart = isAfter(rangeHover, rangeStart)
      return isWithinInterval(day, {
        start: startOfDay(isHoverAfterStart ? rangeStart : rangeHover),
        end: endOfDay(isHoverAfterStart ? rangeHover : rangeStart)
      })
    }

    return false
  }

  // Check if a date is the start of the range
  const isRangeStart = (day: Date) => {
    if (!isRangeMode || !rangeStart || !day) return false
    return isSameDay(day, rangeStart)
  }

  // Check if a date is the end of the range
  const isRangeEnd = (day: Date) => {
    if (!isRangeMode || !rangeEnd || !day) return false
    return isSameDay(day, rangeEnd)
  }

  return (
    <div className="mt-1 grid grid-cols-7">
      {calendarDays.map((day, i) => (
        <div key={i}>
          {day ? (
            <Button
              variant="ghost"
              title={isToday(day) ? 'Today' : undefined}
              className={cn(
                // Base style
                'h-8 w-8 p-0 font-normal relative',

                // Today style
                isToday(day) &&
                  'bg-accent hover:bg-secondary text-accent-foreground rounded-full',

                // Selected style
                !isRangeMode && selectedDate && isSameDay(day, selectedDate ? selectedDate : new Date()) &&
                  'bg-primary text-primary-foreground hover:bg-primary dark:hover:bg-primary hover:text-primary-foreground',

                // Range style
                isRangeMode && isInRange(day) &&
                  'bg-primary/10 dark:bg-primary/20 rounded-none',

                // Range start style
                isRangeMode && isRangeStart(day) &&
                  'bg-primary dark:bg-primary hover:bg-primary dark:hover:bg-primary text-primary-foreground hover:text-primary-foreground dark:hover:text-primary-foreground rounded-l-md rounded-r-none',

                // Range end style
                isRangeMode && isRangeEnd(day) &&
                  'bg-primary dark:bg-primary hover:bg-primary dark:hover:bg-primary text-primary-foreground hover:text-primary-foreground dark:hover:text-primary-foreground rounded-r-md rounded-l-none',

                // Range start and end style
                isRangeMode && isRangeStart(day) && isRangeEnd(day) &&
                  'rounded-md'
              )}
              onClick={() => handleSelect(day)}
              onMouseEnter={() => handleDayHover(day)}
            >
              {day.getDate()}
              {isToday(day) && <span className='size-1 bg-primary absolute bottom-0.5 left-1/2 -translate-x-1/2 rounded-full' />}
            </Button>
          ) : (
            <div className="h-8 w-8" />
          )}
        </div>
      ))}
    </div>
  )
}

function DatePickerListYears ({
  currentMonth,
  view,
  handleMonthSelect
}: {
  currentMonth: Date | null;
  view: 'days' | 'years';
  handleMonthSelect: (year: number, month: number) => void
}) {
  const currentYearRef = React.useRef<HTMLDivElement>(null)

  const currentYear = currentMonth ? currentMonth.getFullYear() : new Date().getFullYear()
  const currentYearValue = `year-${currentYear}`
  const currentMonthIndex = currentMonth ? currentMonth.getMonth() : new Date().getMonth()

  // Scroll to current year when years view is opened
  React.useEffect(() => {
    if (view === 'years' && currentYearRef.current) {
      setTimeout(() => {
        currentYearRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' })
      }, 100)
    }
  }, [view])

  // Generate years from 1950 to 2050
  const years = React.useMemo(() => {
    return Array.from({ length: 2050 - 1950 + 1 }, (_, i) => 1950 + i)
  }, [])

  return (
    <ScrollArea className="h-full pl-2 pr-4">
      <Accordion type="single" collapsible defaultValue={currentYearValue} className="w-full">
        {years.map((year) => (
          <div key={year} ref={year === currentYear ? currentYearRef : undefined}>
            <AccordionItem value={`year-${year}`}>
              <AccordionTrigger className="text-sm py-2 [&>svg]:last:hidden hover:no-underline border-t rounded-none text-foreground/70 hover:text-foreground">
                <ChevronDownIcon className="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" />
                <span className="flex-1">{year}</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-4 gap-2">
                  {MONTHS.map((month, index) => (
                    <Button
                      key={month.name}
                      variant={index === currentMonthIndex && year === currentYear ? 'default' : 'outline'}
                      size="sm"
                      className="text-sm"
                      title={month.full}
                      onClick={() => handleMonthSelect(year, index)}
                    >
                      {month.name}
                    </Button>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </div>
        ))}
      </Accordion>
    </ScrollArea>
  )
}

function DatePickerCalendar ({
  view,
  currentMonth,
  handleSelect,
  isRangeMode,
  rangeStart,
  rangeEnd,
  rangeHover,
  selectedDate,
  handleDayHover,
  handleMonthSelect
}: {
  view: 'days' | 'years';
  currentMonth: Date;
  handleSelect: (day: Date) => void;
  isRangeMode: boolean;
  rangeStart: Date | undefined;
  rangeEnd: Date | undefined;
  rangeHover: Date | undefined;
  selectedDate: Date | undefined;
  handleDayHover: (day: Date) => void;
  handleMonthSelect: (year: number, month: number) => void;
}) {
  return (
    <>
      <div
        className={cn(
          'transition-opacity duration-200',
          view === 'years' ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}
      >
        <DatePickerWeekDays />
        <DatePickerGridDays
          currentMonth={currentMonth}
          handleSelect={handleSelect}
          isRangeMode={isRangeMode}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          rangeHover={rangeHover}
          selectedDate={selectedDate as Date}
          handleDayHover={handleDayHover}
        />
      </div>

      <div
        className={cn(
          'absolute inset-0 z-10 transition-opacity duration-200 bg-popover',
          view === 'years' ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        <DatePickerListYears
          currentMonth={currentMonth as Date}
          handleMonthSelect={handleMonthSelect}
          view={view}
        />
      </div>
    </>
  )
}

const dateOrUndefined = (date: DateValue | undefined) => date instanceof Date ? date : undefined

export function DatePicker ({
  className,
  defaultValue,
  value,
  onValueChange,
  onReset,
  placeholder,
  mode = 'duo',
  onModeChange,
  align = 'end'
}: DatePickerBase & (
  DatePickerSingle | DatePickerRange | DatePickerDuo
)) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(dateOrUndefined(defaultValue))
  const [currentMonth, setCurrentMonth] = React.useState<Date>(dateOrUndefined(value) || dateOrUndefined(defaultValue) || new Date())
  const [isOpen, setIsOpen] = React.useState(false)
  const [view, setView] = React.useState<'days' | 'years'>('days')
  const [isRangeMode, setIsRangeMode] = React.useState(mode === 'range')

  // Range selection states
  const [rangeStart, setRangeStart] = React.useState<Date | undefined>(dateOrUndefined((defaultValue as DateRangeValue)?.from))
  const [rangeEnd, setRangeEnd] = React.useState<Date | undefined>(dateOrUndefined((defaultValue as DateRangeValue)?.to))
  const [rangeHover, setRangeHover] = React.useState<Date | undefined>(undefined)
  // Set range selection states
  React.useEffect(() => {
    if (value && typeof value !== 'object') {
      setRangeStart(value)
      setRangeEnd(undefined)
    } else if (value && 'from' in value) {
      setRangeStart(value.from)
      setRangeEnd(value.to)
    }
  }, [value])

  // Reset view when popover closes, but only after animation completes
  React.useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null

    if (!isOpen && view !== 'days') {
      timeoutId = setTimeout(() => {
        setView('days')
      }, 200)
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [isOpen, view])

  // Handle date selection
  const handleSelect = (day: Date) => {
    if (!isRangeMode) {
      setSelectedDate(day)
      setCurrentMonth(day)
      onValueChange?.(day)
      setIsOpen(false)
    } else if (isRangeMode) {
      // If no start date is selected or if both start and end are already selected
      if (!rangeStart || (rangeStart && rangeEnd)) {
        setRangeStart(day)
        setRangeEnd(undefined)
        setRangeHover(undefined)
      }
      // If only start date is selected and the clicked date is after start
      else if (rangeStart && !rangeEnd) {
        // Ensure proper order (earlier date first)
        const isAfterStart = isAfter(day, rangeStart)

        if (isAfterStart) {
          setRangeEnd(day)
        } else {
          setRangeEnd(rangeStart)
          setRangeStart(day)
        }

        (onValueChange as DatePickerRange['onValueChange'])?.({
          from: isAfterStart ? rangeStart : day,
          to: isAfterStart ? day : rangeStart
        })
        setIsOpen(false)
      }
    }
  }

  // Navigate to previous month
  const previousMonth = () => {
    setCurrentMonth(subMonths(currentMonth instanceof Date ? currentMonth : new Date(), 1))
  }

  // Navigate to next month
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth instanceof Date ? currentMonth : new Date(), 1))
  }

  // Handle month selection
  const handleMonthSelect = (year: number, monthIndex: number) => {
    const newDate = setMonth(setYear(currentMonth instanceof Date ? currentMonth : new Date(), year), monthIndex)
    setCurrentMonth(newDate)
    setView('days')
  }

  // Handle reset
  const handleReset = () => {
    if (!onReset) return

    if (!isRangeMode) {
      setSelectedDate(undefined)
      onValueChange?.(undefined)
    } else if (isRangeMode) {
      setRangeStart(undefined)
      setRangeEnd(undefined)
      setRangeHover(undefined);
      (onValueChange as DatePickerRange['onValueChange'])?.({
        from: undefined,
        to: undefined
      })
    }

    onReset()
  }

  // Handle switch mode
  const handleSwitchMode = (checked: boolean) => {
    setIsRangeMode(checked)
    if (checked) {
      (onValueChange as DatePickerRange['onValueChange'])?.(rangeStart && rangeEnd
        ? { from: rangeStart,to: rangeEnd }
        : undefined)
      rangeStart && setCurrentMonth(rangeStart)
    } else {
      onValueChange?.(selectedDate as Date)
      selectedDate && setCurrentMonth(selectedDate)
    }
    onModeChange?.(checked ? 'range' : 'single')
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <DatePickerTrigger
        className={className}
        placeholder={placeholder}
        selectedDate={selectedDate as Date}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        isRangeMode={isRangeMode}
      />
      <PopoverContent className="w-auto p-0" align={align}>
        <div className="p-3">
          <DatePickerHeader
            currentMonth={currentMonth as Date}
            view={view}
            setView={setView}
            previousMonth={previousMonth}
            nextMonth={nextMonth}
          />

          <div className="relative">
            <DatePickerCalendar
              currentMonth={currentMonth as Date}
              handleMonthSelect={handleMonthSelect}
              handleSelect={handleSelect}
              isRangeMode={isRangeMode}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              rangeHover={rangeHover}
              selectedDate={selectedDate as Date}
              view={view}
              handleDayHover={(day: Date) => {
                if (isRangeMode && rangeStart && !rangeEnd) {
                  setRangeHover(day)
                }
              }}
            />

            {mode === 'duo' && (
              <div className='flex justify-between items-center border-t py-2 text-sm font-medium'>
                Range mode
                <Switch
                  checked={isRangeMode}
                  onCheckedChange={handleSwitchMode}
                />
              </div>
            )}
          </div>

          {onReset && ((!isRangeMode && selectedDate) || (isRangeMode && (rangeStart || rangeEnd))) && (
            <div className='border-t'>
              <Button className="w-full mt-2" variant="secondary" onClick={handleReset}>
                Clear {isRangeMode ? 'range' : 'date'}
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
