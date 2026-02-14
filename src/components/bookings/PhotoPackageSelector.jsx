import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Video, Check } from 'lucide-react';

const photoPackages = [
  { id: '10_photos', name: '10 Fotos', price: 50, description: 'Pacote básico', icon: Camera },
  { id: '12_photos', name: '12 Fotos', price: 60, description: 'Pacote standard', icon: Camera },
  { id: '15_photos', name: '15 Fotos', price: 70, description: 'Pacote premium', icon: Camera },
  { id: '20_photos', name: '20 Fotos', price: 95, description: 'Pacote completo', icon: Camera },
  { id: 'video_1min', name: 'Vídeo 1min', price: 35, description: 'Vídeo profissional', icon: Video },
];

export default function PhotoPackageSelector({ open, onClose, onSelect }) {
  const [selected, setSelected] = useState(null);

  const handleConfirm = () => {
    if (selected) {
      onSelect(selected);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-[#B8956A]" />
            Adicionar Sessão Fotográfica
          </DialogTitle>
          <p className="text-sm text-stone-500">
            Capture os melhores momentos da sua aula de equitação
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {photoPackages.map((pkg) => {
            const Icon = pkg.icon;
            const isSelected = selected?.id === pkg.id;
            
            return (
              <Card
                key={pkg.id}
                className={`p-4 cursor-pointer transition-all border-2 hover:shadow-lg ${
                  isSelected 
                    ? 'border-[#B8956A] bg-[#B8956A]/5' 
                    : 'border-stone-200 hover:border-[#B8956A]/50'
                }`}
                onClick={() => setSelected(pkg)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isSelected ? 'bg-[#B8956A]' : 'bg-stone-100'
                    }`}>
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-stone-600'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{pkg.name}</h3>
                      <p className="text-xs text-stone-500">{pkg.description}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-[#B8956A] flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-4">
                  <Badge className="bg-[#2D2D2D] text-white">{pkg.price}€</Badge>
                  <span className="text-xs text-stone-500">Entrega digital</span>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="p-4 bg-blue-50 rounded-lg mt-4">
          <p className="text-sm text-blue-800">
            <strong>ℹ️ Informação:</strong> As fotos serão entregues em formato digital de alta qualidade. 
            Fotos extra: 6€/foto.
          </p>
        </div>

        <div className="flex gap-3 mt-4">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Não, Obrigado
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selected}
            className="flex-1 bg-[#B8956A] hover:bg-[#A88559]"
          >
            Adicionar {selected?.price}€
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}