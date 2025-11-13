      // Day-first format: Day, Train, Times...
      currentDay = dayMap[firstCol];
      currentDate = null;
      trainId = columns[1];
      times = columns.slice(2, 14);
      dayOfWeek = currentDay;
      
      // Use reference date for régime rows
      const referenceDates: Record<DayOfWeek, string> = {
        'monday': '2025-01-06',
        'tuesday': '2025-01-07',
        'wednesday': '2025-01-08',
        'thursday': '2025-01-09',
        'friday': '2025-01-10',
        'saturday': '2025-01-11',
        'sunday': '2025-01-12',
      };
      dateStr = referenceDates[currentDay];
      
    } else if (firstCol?.match(/^\d{4}-\d{2}-\d{2}$/)) {