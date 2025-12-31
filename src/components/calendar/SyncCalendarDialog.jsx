import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, ExternalLink, Calendar as CalendarIcon } from 'lucide-react';

export default function SyncCalendarDialog({ events, onClose }) {
  const generateICalendar = () => {
    let ical = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Picadeiro Quinta da Horta//PT\n';
    
    events.forEach(event => {
      const startDate = new Date(event.start_date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const endDate = new Date(event.end_date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      ical += 'BEGIN:VEVENT\n';
      ical += `UID:${event.id}@picadeiroquintadahorta.com\n`;
      ical += `DTSTAMP:${startDate}\n`;
      ical += `DTSTART:${startDate}\n`;
      ical += `DTEND:${endDate}\n`;
      ical += `SUMMARY:${event.title}\n`;
      if (event.description) {
        ical += `DESCRIPTION:${event.description}\n`;
      }
      if (event.location) {
        ical += `LOCATION:${event.location}\n`;
      }
      ical += 'END:VEVENT\n';
    });
    
    ical += 'END:VCALENDAR';
    
    const blob = new Blob([ical], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'picadeiro-eventos.ics';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const googleCalendarUrl = () => {
    const baseUrl = 'https://calendar.google.com/calendar/r';
    window.open(baseUrl, '_blank');
  };

  const outlookCalendarUrl = () => {
    const baseUrl = 'https://outlook.live.com/calendar/';
    window.open(baseUrl, '_blank');
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-[#2D2D2D]">
            Sincronizar Calendário
          </DialogTitle>
          <DialogDescription>
            Exporte ou sincronize os eventos com o seu calendário preferido
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={generateICalendar}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#B8956A]/10 flex items-center justify-center">
                <Download className="w-6 h-6 text-[#B8956A]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[#2D2D2D]">Exportar para ICS</h3>
                <p className="text-sm text-stone-600">Baixar arquivo para importar</p>
              </div>
              <ExternalLink className="w-5 h-5 text-stone-400" />
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={googleCalendarUrl}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[#2D2D2D]">Google Calendar</h3>
                <p className="text-sm text-stone-600">Sincronizar com Google</p>
              </div>
              <ExternalLink className="w-5 h-5 text-stone-400" />
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={outlookCalendarUrl}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-blue-700" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[#2D2D2D]">Outlook Calendar</h3>
                <p className="text-sm text-stone-600">Sincronizar com Outlook</p>
              </div>
              <ExternalLink className="w-5 h-5 text-stone-400" />
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 p-4 bg-stone-50 rounded-lg">
          <p className="text-xs text-stone-600">
            <strong>Nota:</strong> Após exportar, você pode importar o arquivo ICS no seu aplicativo de calendário preferido.
            Para sincronização automática, use as integrações nativas do Google Calendar ou Outlook.
          </p>
        </div>

        <Button onClick={onClose} variant="outline" className="w-full">
          Fechar
        </Button>
      </DialogContent>
    </Dialog>
  );
}