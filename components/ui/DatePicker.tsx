"use client";

import React from 'react';
import { CalendarPicker } from '@/components/booking/CalendarPicker';

interface DatePickerProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export function DatePicker({ selectedDate, onSelectDate }: DatePickerProps) {
  return (
    <div>
      <CalendarPicker selectedDate={selectedDate} onSelectDate={onSelectDate} />
    </div>
  );
}
