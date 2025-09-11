import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, X } from 'lucide-react';

interface AmountEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (amount: string) => void;
  itemName: string;
  currentAmount: number;
}

const AmountEditModal = ({
  isOpen,
  onClose,
  onSave,
  itemName,
  currentAmount
}: AmountEditModalProps) => {
  const [amount, setAmount] = useState(currentAmount.toString());
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setAmount(currentAmount.toString());
      setError('');
    }
  }, [isOpen, currentAmount]);

  const validateInput = (): boolean => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 0) {
      setError('请输入有效的金额');
      return false;
    } else if (amountNum > 10000) {
      setError('金额不能超过10000万元');
      return false;
    }
    setError('');
    return true;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
    if (value) {
      validateInput();
    }
  };

  const handleSave = () => {
    if (validateInput()) {
      onSave(amount);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            修改{itemName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              金额
            </Label>
            <div className="relative">
              <Input
                type="number"
                value={amount}
                onChange={handleAmountChange}
                onKeyDown={handleKeyDown}
                placeholder="0-10000"
                className={`pr-12 text-base ${error ? 'border-red-500 focus-visible:ring-red-500' : 'border-gray-300'}`}
                autoFocus
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                万元
              </span>
            </div>
            {error && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <X className="w-4 h-4" />
                {error}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            取消
          </Button>
          <Button
            onClick={handleSave}
            disabled={!!error || !amount}
            className="flex-1 bg-gradient-to-r from-[#CCE9B5] to-[#B8E0A1] text-gray-900 hover:from-[#BBE3A8] hover:to-[#A5D094]"
          >
            确认修改
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AmountEditModal;