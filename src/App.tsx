import { useState } from 'react'
import { DatePicker, type DateValue, type DatePickerModes, type DateRangeValue } from '@/components/date-picker'
import { format } from 'date-fns'

const formatDateText = (date: DateValue | undefined, placeholder: string) => {
  if (!date) return placeholder
  if (date instanceof Date) return format(date, 'PPP')
  if (date.from && date.to) return `${format(date.from, 'PPP')} - ${format(date.to, 'PP')}`
  throw new Error('Invalid date')
}

function App () {
  const [singleDate, setSingleDate] = useState<Date | undefined>()
  const [rangeDate, setRangeDate] = useState<DateRangeValue>()
  const [duoDate, setDuoDate] = useState<DateValue | undefined>()
  const [mode, setMode] = useState<DatePickerModes>()

  return (
    <main className='min-h-svh flex flex-col items-center p-6'>
      <h1 className='text-foreground text-7xl font-thin my-10'>Date Picker</h1>
      <div className="flex flex-wrap gap-10 [&>div]:pr-10 [&>div]:border-r [&>div]:last:border-r-0 [&_h2]:font-light [&_h2]:text-xl [&_h2]:mb-2 [&_p]:text-sm [&_p]:font-light">
        <div>
          <h2>Single mode</h2>
          <DatePicker
            className='mb-4'
            mode="single"
            onValueChange={setSingleDate}
            value={singleDate}
          />
          <p><strong>Mode:</strong> single</p>
          <p>
            <strong>Date: </strong>
            {formatDateText(singleDate, 'pick a date')}
          </p>
        </div>
        <div>
          <h2>Range mode</h2>
          <DatePicker
            className='mb-4'
            mode="range"
            onValueChange={setRangeDate}
            value={rangeDate}
          />
          <p><strong>Mode:</strong> range</p>
          <p>
            <strong>Date: </strong>
            {formatDateText(rangeDate, 'pick a range')}
          </p>
        </div>
        <div>
          <h2>Duo mode</h2>
          <DatePicker
            className='mb-4'
            onModeChange={setMode}
            onValueChange={setDuoDate}
          />
          <p><strong>Mode:</strong> duo ({mode})</p>
          <p>
            <strong>Date: </strong>
            {formatDateText(duoDate, mode === 'single' ? 'pick a date' : 'pick a range')}
          </p>
        </div>
      </div>
    </main>
  )
}

export default App
