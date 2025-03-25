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
  onModeChange?: (mode: `${Modes}`) => void
}

type DatePickerProps = DatePickerBase & (DatePickerSingle | DatePickerRange | DatePickerDuo)

export function DatePicker ({
  className,
  defaultValue,
  value,
  onValueChange,
  onReset,
  placeholder,
  mode = 'duo',
  onModeChange
}: DatePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<DateValue | undefined>(defaultValue)
  const [currentMonth, setCurrentMonth] = React.useState<DateValue>(value || defaultValue || new Date())
  const [isOpen, setIsOpen] = React.useState(false)
  const [view, setView] = React.useState<'days' | 'years'>('days')
  const [isRangeMode, setIsRangeMode] = React.useState(mode === 'range')

  // Range selection states
  const [rangeStart, setRangeStart] = React.useState<Date | undefined>(undefined)
  const [rangeEnd, setRangeEnd] = React.useState<Date | undefined>(undefined)
  const [rangeHover, setRangeHover] = React.useState<Date | undefined>(undefined)

  // Get the current year for the accordion default value
  const currentYear = currentMonth instanceof Date ? currentMonth.getFullYear() : new Date().getFullYear()
  const currentYearValue = `year-${currentYear}`
  const currentMonthIndex = currentMonth instanceof Date ? currentMonth.getMonth() : new Date().getMonth()

  // Reference to the current year's accordion item
  const currentYearRef = React.useRef<HTMLDivElement>(null)

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
      // Delay the view reset until after the popover closing animation completes
      timeoutId = setTimeout(() => {
        setView('days')
      }, 200) // This should match or exceed the popover closing animation duration
    }

    // Clean up the timeout if the component unmounts or if isOpen changes before timeout completes
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [isOpen, view])

  // Scroll to current year when years view is opened
  React.useEffect(() => {
    if (view === 'years' && currentYearRef.current) {
      setTimeout(() => {
        currentYearRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' })
      }, 100)
    }
  }, [view])

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

  // Handle mouse hover for range selection
  const handleDayHover = (day: Date) => {
    if (isRangeMode && rangeStart && !rangeEnd) {
      setRangeHover(day)
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

  // Toggle between days and years view
  const toggleView = () => {
    setView(view === 'days' ? 'years' : 'days')
  }

  // Handle month selection
  const handleMonthSelect = (year: number, monthIndex: number) => {
    const newDate = setMonth(setYear(currentMonth instanceof Date ? currentMonth : new Date(), year), monthIndex)
    setCurrentMonth(newDate)
    setView('days')
  }

  // Generate years from 1950 to 2050
  const years = React.useMemo(() => {
    return Array.from({ length: 2050 - 1950 + 1 }, (_, i) => 1950 + i)
  }, [])

  // Generate months with short names
  const months = [
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

  // Generate calendar days
  const calendarDays = React.useMemo(() => {
    const daysInMonth = getDaysInMonth(currentMonth instanceof Date ? currentMonth : new Date())
    const startDay = getDay(startOfMonth(currentMonth instanceof Date ? currentMonth : new Date()))
    const days = []

    // Add empty cells for days before the start of the month
    for (let i = 0; i < startDay; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth instanceof Date ? currentMonth.getFullYear() : new Date().getFullYear(), currentMonth instanceof Date ? currentMonth.getMonth() : new Date().getMonth(), day)
      days.push(date)
    }

    return days
  }, [currentMonth])

  // Day names
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  // Check if a date is within the selected range
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

  // Format the display text for the date picker button
  const formatDisplayText = () => {
    const placeholderText = placeholder ? placeholder : `Pick a ${isRangeMode ? 'date range' : 'date'}`
    if (!isRangeMode) {
      return selectedDate ? format(selectedDate instanceof Date ? selectedDate : new Date(), 'PPP') : placeholderText
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

    // setIsOpen(false)
    onReset()
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
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
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          <div className="flex items-center justify-between pb-1">
            <Button
              variant="ghost"
              className="text-sm font-medium flex items-center data-[state=open]:text-muted-foreground/80 [&[data-state=open]>svg]:rotate-180"
              onClick={toggleView}
              data-state={view === 'years' ? 'open' : 'closed'}
            >
              {format(currentMonth instanceof Date ? currentMonth : new Date(), 'MMMM yyyy')}
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

          <div className="relative">
            <div
              className={cn(
                'transition-opacity duration-200',
                view === 'years' ? 'opacity-0 pointer-events-none' : 'opacity-100'
              )}
            >
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {dayNames.map((day) => (
                  <div key={day} className="py-1 font-medium">
                    {day}
                  </div>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7">
                {calendarDays.map((day, i) => (
                  <div key={i}>
                    {day ? (
                      <Button
                        variant="ghost"
                        title={isToday(day) ? 'Today' : undefined}
                        className={cn(
                          'h-8 w-8 p-0 font-normal relative',
                          isToday(day) && 'bg-accent hover:bg-secondary text-accent-foreground rounded-full',
                          !isRangeMode &&
                            selectedDate &&
                            isSameDay(day, selectedDate instanceof Date ? selectedDate : new Date()) &&
                            'bg-primary text-primary-foreground hover:bg-primary dark:hover:bg-primary hover:text-primary-foreground',
                          isRangeMode && isInRange(day) && 'bg-primary/10 dark:bg-primary/20 rounded-none',
                          isRangeMode &&
                            isRangeStart(day) &&
                            'bg-primary dark:bg-primary hover:bg-primary dark:hover:bg-primary text-primary-foreground hover:text-primary-foreground dark:hover:text-primary-foreground rounded-l-md rounded-r-none',
                          isRangeMode &&
                            isRangeEnd(day) &&
                            'bg-primary dark:bg-primary hover:bg-primary dark:hover:bg-primary text-primary-foreground hover:text-primary-foreground dark:hover:text-primary-foreground rounded-r-md rounded-l-none',
                          isRangeMode && isRangeStart(day) && isRangeEnd(day) && 'rounded-md'
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
            </div>

            <div
              className={cn(
                'absolute inset-0 z-10 transition-opacity duration-200 bg-popover',
                view === 'years' ? 'opacity-100' : 'opacity-0 pointer-events-none'
              )}
            >
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
                            {months.map((month, index) => (
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
            </div>
            {mode === 'duo' && (
              <div className='flex justify-between items-center border-t py-2 text-sm font-medium'>
                Range mode
                <Switch
                  checked={isRangeMode}
                  onCheckedChange={(isChecked) => {
                    setIsRangeMode(isChecked)
                    if (isChecked) {
                      (onValueChange as DatePickerRange['onValueChange'])?.(rangeStart && rangeEnd
                        ? { from: rangeStart,to: rangeEnd }
                        : undefined)
                      rangeStart && setCurrentMonth(rangeStart)
                    } else {
                      onValueChange?.(selectedDate as Date)
                      selectedDate && setCurrentMonth(selectedDate)
                    }
                    onModeChange?.(isChecked ? 'range' : 'single')
                  }}
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
