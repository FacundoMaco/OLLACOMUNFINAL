import React, { useState } from 'react';
import { Transaction, ProductPrice, OllaLocation } from '../types';
import Card from './shared/Card';
import { Heart, Package, User, Plus, MapPin, Repeat, Calendar, X } from 'lucide-react';

interface DonationManagerProps {
  addTransaction: (newTx: Omit<Transaction, 'id' | 'hash' | 'date'>) => void;
  priceData: ProductPrice[];
  ollas: OllaLocation[];
  onAddDonationToInventory?: (donation: { product: string; quantity: number; unit: string }, addToDaily: boolean) => void;
}

const DonationManager: React.FC<DonationManagerProps> = ({ addTransaction, priceData, ollas, onAddDonationToInventory }) => {
  const [transactionType, setTransactionType] = useState<'Donación' | 'Intercambio'>('Donación');
  const [newTransaction, setNewTransaction] = useState({ 
    product: '', 
    quantity: 1, 
    unit: 'kg', 
    from: '', 
    to: ollas[0]?.name || '' 
  });
  const [suggestions, setSuggestions] = useState<ProductPrice[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showDonationDialog, setShowDonationDialog] = useState(false);
  const [lastDonation, setLastDonation] = useState<{ product: string; quantity: number; unit: string } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTransaction(prev => ({ ...prev, [name]: value }));
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewTransaction(prev => ({ ...prev, product: value }));
    if (value.length > 1) {
      setSuggestions(priceData.filter(p => p.name.toLowerCase().includes(value.toLowerCase())).slice(0, 5));
    } else {
      setSuggestions([]);
    }
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransaction.product || newTransaction.quantity <= 0 || !newTransaction.to) {
      setError("Por favor, completa todos los campos requeridos.");
      return;
    }
    
    if (transactionType === 'Intercambio' && !newTransaction.from) {
      setError("Para intercambios, debes especificar la olla de origen.");
      return;
    }
    
    addTransaction({
      type: transactionType,
      product: newTransaction.product,
      quantity: newTransaction.quantity,
      unit: newTransaction.unit,
      from: transactionType === 'Intercambio' 
        ? newTransaction.from 
        : (newTransaction.from || 'Donante Anónimo'),
      to: newTransaction.to,
    });

    // Si es una donación, mostrar diálogo para agregar al inventario
    if (transactionType === 'Donación' && onAddDonationToInventory) {
      setLastDonation({
        product: newTransaction.product,
        quantity: newTransaction.quantity,
        unit: newTransaction.unit
      });
      setShowDonationDialog(true);
    }

    setNewTransaction({ 
      product: '', 
      quantity: 1, 
      unit: 'kg', 
      from: '', 
      to: ollas[0]?.name || '' 
    });
    setError(null);
  };

  const handleAddToInventory = (addToDaily: boolean) => {
    if (lastDonation && onAddDonationToInventory) {
      onAddDonationToInventory(lastDonation, addToDaily);
    }
    setShowDonationDialog(false);
    setLastDonation(null);
  };

  const handleSkipInventory = () => {
    setShowDonationDialog(false);
    setLastDonation(null);
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-[#f7931e] to-[#ff9f3a] p-3 rounded-xl shadow-lg">
            {transactionType === 'Donación' ? (
              <Heart className="text-white" size={28} strokeWidth={2} />
            ) : (
              <Repeat className="text-white" size={28} strokeWidth={2} />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Registrar Transacción</h2>
            <p className="text-sm text-gray-600">Registra donaciones e intercambios</p>
          </div>
        </div>

        <form onSubmit={handleAddTransaction} className="space-y-5">
          {/* Selector de tipo de transacción */}
          <div>
            <label className="block font-semibold text-gray-700 mb-2">
              Tipo de Transacción
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTransactionType('Donación')}
                className={`p-4 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                  transactionType === 'Donación'
                    ? 'border-[#f7931e] bg-[#fff8ed] text-[#f7931e]'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <Heart size={20} />
                <span className="font-semibold">Donación</span>
              </button>
              <button
                type="button"
                onClick={() => setTransactionType('Intercambio')}
                className={`p-4 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                  transactionType === 'Intercambio'
                    ? 'border-[#f7931e] bg-[#fff8ed] text-[#f7931e]'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <Repeat size={20} />
                <span className="font-semibold">Intercambio</span>
              </button>
            </div>
          </div>
          <div className="relative">
            <label htmlFor="product" className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
              <Package size={18} className="text-[#f7931e]" />
              Producto
            </label>
            <input
              type="text"
              id="product"
              name="product"
              value={newTransaction.product}
              onChange={handleProductChange}
              placeholder="Buscar producto (ej: arroz, aceite, pollo...)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f7931e] focus:border-[#f7931e] transition-all"
              required
            />
            {suggestions.length > 0 && (
              <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 shadow-xl max-h-48 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <li 
                    key={i} 
                    onClick={() => { setNewTransaction(p => ({...p, product: s.name})); setSuggestions([]); }} 
                    className="p-3 hover:bg-[#fff8ed] cursor-pointer capitalize flex items-center gap-2 transition-colors"
                  >
                    <Package size={16} className="text-[#f7931e]" />
                    {s.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label htmlFor="quantity" className="block font-semibold text-gray-700 mb-2">
                Cantidad
              </label>
              <input 
                type="number" 
                id="quantity" 
                name="quantity" 
                value={newTransaction.quantity} 
                onChange={handleInputChange} 
                min="0.1" 
                step="0.1" 
                placeholder="1"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f7931e] focus:border-[#f7931e]" 
                required 
              />
            </div>
            <div className="w-40">
              <label htmlFor="unit" className="block font-semibold text-gray-700 mb-2">
                Unidad
              </label>
              <select 
                id="unit" 
                name="unit" 
                value={newTransaction.unit} 
                onChange={handleInputChange} 
                className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#f7931e] focus:border-[#f7931e]"
              >
                <option value="kg">kg</option>
                <option value="litros">litros</option>
                <option value="unidades">unidades</option>
                <option value="latas">latas</option>
              </select>
            </div>
          </div>

          {/* Campo de origen - requerido para intercambios */}
          {transactionType === 'Intercambio' && (
            <div>
              <label htmlFor="from" className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
                <MapPin size={18} className="text-[#f7931e]" />
                Olla de Origen
              </label>
              <select
                id="from"
                name="from"
                value={newTransaction.from}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#f7931e] focus:border-[#f7931e]"
                required
              >
                <option value="">Selecciona la olla de origen</option>
                {ollas.length > 0 ? (
                  ollas.map(olla => (
                    <option key={olla.id} value={olla.name}>{olla.name}</option>
                  ))
                ) : (
                  <option value="" disabled>No hay ollas registradas</option>
                )}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="to" className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
              <MapPin size={18} className="text-[#f7931e]" />
              {transactionType === 'Intercambio' ? 'Olla de Destino' : 'Destino'}
            </label>
            <select
              id="to"
              name="to"
              value={newTransaction.to}
              onChange={handleInputChange}
              className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#f7931e] focus:border-[#f7931e]"
              required
            >
              {ollas.length > 0 ? (
                ollas.map(olla => (
                  <option key={olla.id} value={olla.name}>{olla.name}</option>
                ))
              ) : (
                <option value="" disabled>No hay ollas registradas</option>
              )}
            </select>
          </div>

          {/* Campo de donante - solo para donaciones */}
          {transactionType === 'Donación' && (
            <div className="relative">
              <label htmlFor="from" className="flex items-center gap-2 font-semibold text-gray-700 mb-2">
                <User size={18} className="text-[#f7931e]" />
                Donante (Opcional)
              </label>
              <input 
                type="text" 
                id="from" 
                name="from" 
                value={newTransaction.from} 
                onChange={handleInputChange} 
                placeholder="Nombre del donante o empresa (opcional)" 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#f7931e] focus:border-[#f7931e]" 
              />
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-[#f7931e] to-[#ff9f3a] text-white py-4 rounded-xl font-bold hover:shadow-xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg"
          >
            <Plus size={24} strokeWidth={2.5} />
            {transactionType === 'Donación' ? 'Registrar Donación' : 'Registrar Intercambio'}
          </button>
        </form>

        {error && (
          <div className="text-red-700 bg-red-50 p-4 rounded-lg border border-red-200 flex items-start gap-3 mt-4">
            <div className="text-red-500 mt-0.5">⚠</div>
            <div className="flex-1">{error}</div>
          </div>
        )}
      </Card>

      {/* Diálogo para agregar donación al inventario */}
      {showDonationDialog && lastDonation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-pink-500 to-red-500 p-2 rounded-lg">
                  <Heart className="text-white" size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">¿Agregar al Inventario?</h3>
              </div>
              <button
                onClick={handleSkipInventory}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-4">
                La donación de <strong>{lastDonation.quantity} {lastDonation.unit}</strong> de <strong>{lastDonation.product}</strong> ha sido registrada.
              </p>
              <p className="text-gray-600 text-sm mb-4">
                ¿Deseas agregarla al inventario?
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleAddToInventory(true)}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Calendar size={20} />
                Agregar a Uso Diario (para cocinar hoy)
              </button>
              
              <button
                onClick={() => handleAddToInventory(false)}
                className="w-full bg-gradient-to-r from-[#f7931e] to-[#ff9f3a] text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Package size={20} />
                Guardar en Inventario Total (para usar durante la semana)
              </button>
              
              <button
                onClick={handleSkipInventory}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-all"
              >
                No agregar al inventario
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default DonationManager;