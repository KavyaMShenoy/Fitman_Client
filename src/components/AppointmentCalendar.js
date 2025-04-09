import React, { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { parse, startOfWeek, format, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { parseISO } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import CustomToolbar from './CustomToolbar';

import '../css/AppointmentCalendar.css';

const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { locale: enUS }),
    getDay,
    locales,
});

const AppointmentCalendar = ({ appointments }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const events = appointments.map(appt => ({
        title: `${appt.serviceType.replace("_", " ")} with ${appt.trainerId?.fullName || 'Trainer'}`,
        start: parseISO(appt.appointmentDate),
        end: parseISO(appt.appointmentDate),
        allDay: true,
        resource: appt,
    }));

    return (
        <div className="calendar-wrapper">
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                date={currentDate}
                onNavigate={date => setCurrentDate(date)}
                style={{ height: '80vh', borderRadius: '12px' }}
                defaultView="month"
                views={['month']}
                components={{ toolbar: CustomToolbar }}
            />
        </div>
    );
};

export default AppointmentCalendar;