import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

export default function ProductFilters({ filters, onFilterChange }) {
  const categories = [
    { value: 'equipamento', label: 'Equipamento' },
    { value: 'vestuario', label: 'Vestuário' },
    { value: 'acessorios', label: 'Acessórios' },
    { value: 'cuidados_cavalo', label: 'Cuidados do Cavalo' },
    { value: 'decoracao', label: 'Decoração' }
  ];

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Categories */}
        <div>
          <h3 className="font-semibold mb-3">Categorias</h3>
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.value} className="flex items-center space-x-2">
                <Checkbox id={category.value} />
                <Label htmlFor={category.value} className="text-sm cursor-pointer">
                  {category.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <h3 className="font-semibold mb-3">Preço</h3>
          <Slider
            defaultValue={[0, 500]}
            max={500}
            step={10}
            className="mb-2"
          />
          <div className="flex justify-between text-sm text-stone-600">
            <span>0€</span>
            <span>500€</span>
          </div>
        </div>

        {/* Availability */}
        <div>
          <h3 className="font-semibold mb-3">Disponibilidade</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="in-stock" />
              <Label htmlFor="in-stock" className="text-sm cursor-pointer">
                Em stock
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="on-sale" />
              <Label htmlFor="on-sale" className="text-sm cursor-pointer">
                Em promoção
              </Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}