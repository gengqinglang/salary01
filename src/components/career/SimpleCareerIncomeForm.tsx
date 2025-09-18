import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface IncomeFluctuation {
  id: string;
  startYear: number;
  endYear: number;
  growthRate: number; // percentage
}

interface CareerIncomeData {
  currentAge: number;
  currentIncome: number; // 万元/年
  retirementAge: number;
  incomeChange: 'stable' | 'fluctuation';
  fluctuations: IncomeFluctuation[];
  currentStatus?: 'retired' | 'not-retired'; // 当前状态
  retirementIncome?: number; // 退休金（元/月）
  expectedRetirementSalary?: number; // 预计退休工资（元/月）
}

interface SimpleCareerIncomeFormProps {
  data: CareerIncomeData;
  onChange: (data: CareerIncomeData) => void;
  onSave?: () => void;
  isSaved?: boolean;
}

const SimpleCareerIncomeForm: React.FC<SimpleCareerIncomeFormProps> = ({ 
  data, 
  onChange, 
  onSave, 
  isSaved = false 
}) => {
  const [fluctuations, setFluctuations] = useState<IncomeFluctuation[]>(data.fluctuations || []);
  const [growthRateInputs, setGrowthRateInputs] = useState<Record<string, string>>({});
  const [retirementSalaryEdited, setRetirementSalaryEdited] = useState(false);

  // 同步本地输入态与波动配置
  useEffect(() => {
    setGrowthRateInputs((prev) => {
      const next: Record<string, string> = {};
      fluctuations.forEach((f) => {
        next[f.id] = prev[f.id] ?? f.growthRate.toString();
      });
      return next;
    });
  }, [fluctuations]);

  // 根据年龄自动设置当前状态
  useEffect(() => {
    const age = data.currentAge || 30;
    const newStatus = age >= 60 ? 'retired' : 'not-retired';
    if (data.currentStatus !== newStatus) {
      handleDataChange('currentStatus', newStatus);
    }
  }, [data.currentAge]);

  // 设置收入变化默认值
  useEffect(() => {
    if (!data.incomeChange) {
      handleDataChange('incomeChange', 'stable');
    }
  }, []);

  const handleDataChange = (field: keyof CareerIncomeData, value: any) => {
    const newData = {
      ...data,
      [field]: value
    };
    
    onChange(newData);
    
    // Auto-save when form becomes valid
    if (isFormValidWithData(newData) && onSave) {
      onSave();
    }
  };

  const addFluctuation = () => {
    // 计算新波动期的开始年龄
    let newStartYear = data.currentAge + 1;
    if (fluctuations.length > 0) {
      // 找到最后一个波动期的结束年龄
      const lastFluctuation = fluctuations[fluctuations.length - 1];
      newStartYear = lastFluctuation.endYear + 1;
    }
    
    const newFluctuation: IncomeFluctuation = {
      id: Date.now().toString(),
      startYear: newStartYear,
      endYear: Math.min(newStartYear + 4, data.retirementAge - 1), // 确保不超过退休年龄-1
      growthRate: 3
    };
    const newFluctuations = [...fluctuations, newFluctuation];
    setFluctuations(newFluctuations);
    handleDataChange('fluctuations', newFluctuations);
  };

  const removeFluctuation = (id: string) => {
    const newFluctuations = fluctuations.filter(f => f.id !== id);
    setFluctuations(newFluctuations);
    handleDataChange('fluctuations', newFluctuations);
  };

  const updateFluctuation = (id: string, field: keyof IncomeFluctuation, value: any) => {
    const newFluctuations = fluctuations.map(f => 
      f.id === id ? { ...f, [field]: value } : f
    );
    setFluctuations(newFluctuations);
    handleDataChange('fluctuations', newFluctuations);
  };

  // 计算收入预测表
  const calculateIncomeTable = () => {
    try {
      // 基本校验与安全数值
      const currentAge = Number.isFinite(data.currentAge) ? (data.currentAge as number) : 0;
      const retirementAge = Number.isFinite(data.retirementAge) ? (data.retirementAge as number) : 0;
      const baseIncome = typeof data.currentIncome === 'number' && Number.isFinite(data.currentIncome)
        ? (data.currentIncome as number)
        : 0;

      const years = Math.max(0, retirementAge - currentAge);
      const table: Array<{ year: number; income: number; growthRate: number; isRetired: boolean } > = [];

      // 退休前收入（不包含退休当年）
      for (let i = 0; i < years; i++) {
        const year = currentAge + i;
        let income = baseIncome;
        let growthRate: number = 0;

        if (data.incomeChange === 'stable') {
          income = baseIncome;
          growthRate = 0;
        } else if (data.incomeChange === 'fluctuation') {
          // 找到当前年份适用的波动区间
          const applicableFluctuation = fluctuations.find(f => year >= f.startYear && year <= f.endYear);
          if (applicableFluctuation) {
            // 使用固定增长率，不是复合增长
            // 在整个年龄区间内，每年都基于原始收入应用同样的增长率
            const rate = (applicableFluctuation.growthRate ?? 0) / 100;
            income = baseIncome * (1 + rate);
            growthRate = applicableFluctuation.growthRate ?? 0;
          } else {
            income = baseIncome;
            growthRate = 0;
          }
        }

        const safeIncome = Number.isFinite(income) ? income : 0;
        const safeGrowth = Number.isFinite(growthRate) ? growthRate : 0;

        table.push({
          year,
          income: Math.round(safeIncome * 100) / 100,
          growthRate: safeGrowth,
          isRetired: false
        });
      }

      // 退休后收入（从退休年龄到85岁）
      const retirementSalaryMonthly = (data.expectedRetirementSalary !== undefined && Number.isFinite(data.expectedRetirementSalary))
        ? (data.expectedRetirementSalary as number)
        : Math.round((baseIncome * 10000 / 12) * 0.3);

      if (retirementSalaryMonthly > 0) {
        for (let i = retirementAge; i <= 85; i++) {
          const annualRetirementIncome = (retirementSalaryMonthly * 12) / 10000; // 转换为万元
          table.push({
            year: i,
            income: Math.round(((Number.isFinite(annualRetirementIncome) ? annualRetirementIncome : 0) * 100)) / 100,
            growthRate: 0,
            isRetired: true
          });
        }
      }

      return table;
    } catch (error) {
      console.error('calculateIncomeTable error:', error);
      return [];
    }
  };

  const incomeTable = useMemo(() => calculateIncomeTable(), [data, fluctuations]);

  // 验证表单完整性
  const isFormValid = () => {
    return isFormValidWithData(data);
  };

  const isFormValidWithData = (formData: CareerIncomeData) => {
    if (formData.currentStatus === 'retired') {
      return (formData.retirementIncome || 0) >= 0;
    }
    const validCurrentIncome = typeof formData.currentIncome === 'number' && 
                              Number.isFinite(formData.currentIncome) && 
                              formData.currentIncome > 0;
    return validCurrentIncome && 
           formData.retirementAge > formData.currentAge &&
           (formData.incomeChange !== 'fluctuation' || (formData.fluctuations && formData.fluctuations.length > 0));
  };


  return (
    <>
      {/* 基本信息录入 */}
      <Card className="w-full space-y-6 bg-gradient-to-br from-white to-[#CAF4F7]/20 border-[#CAF4F7]/30 shadow-sm">
        <CardContent className="space-y-6 px-3 pt-6 pb-6 relative bg-white border-2 border-[#B3EBEF] rounded-lg">
          {/* 年龄录入 */}
          <div className="space-y-2 relative z-10">
            <Label htmlFor="currentAge" className="text-gray-700 font-medium">本人年龄</Label>
            <Select 
              value={data.currentAge?.toString() || "30"} 
              onValueChange={(value) => handleDataChange('currentAge', parseInt(value))}
            >
              <SelectTrigger className="border-2 border-[#B3EBEF] focus:border-[#B3EBEF] focus:ring-[#B3EBEF]/40">
                <SelectValue placeholder="请选择年龄" />
              </SelectTrigger>
              <SelectContent className="max-h-60 overflow-y-auto bg-white z-50">
                {Array.from({ length: 68 }, (_, i) => i + 18).map((age) => (
                  <SelectItem key={age} value={age.toString()}>
                    {age}岁
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 当前状态选择 */}
          <div className="space-y-3 relative z-10">
            <Label className="text-gray-700 font-medium">当前状态</Label>
            <RadioGroup
              value={data.currentStatus || 'not-retired'}
              onValueChange={(value) => handleDataChange('currentStatus', value)}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-[#B3EBEF] hover:bg-[#CAF4F7]/20 transition-colors">
                <RadioGroupItem value="not-retired" id="not-retired" className="border-2 border-[#B3EBEF] data-[state=checked]:border-[#01BCD6] data-[state=checked]:text-[#01BCD6]" />
                <Label htmlFor="not-retired" className="cursor-pointer">未退休</Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border-2 border-[#B3EBEF] hover:bg-[#CAF4F7]/20 transition-colors">
                <RadioGroupItem value="retired" id="retired" className="border-2 border-[#B3EBEF] data-[state=checked]:border-[#01BCD6] data-[state=checked]:text-[#01BCD6]" />
                <Label htmlFor="retired" className="cursor-pointer">已退休</Label>
              </div>
            </RadioGroup>
          </div>

          {/* 退休状态下的退休金录入 */}
          {(data.currentStatus || 'not-retired') === 'retired' && (
            <div className="space-y-2 relative z-10">
              <div className="flex items-center gap-2">
                <Label htmlFor="retirementIncome" className="text-gray-700 font-medium">退休金（元/月）</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button type="button" className="text-gray-400 hover:text-gray-600 transition-colors">
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-3">
                    <p className="text-sm text-gray-600">
                      如果您有退休金之外的收入，请在下个环节，录入其他收入时录入。
                    </p>
                  </PopoverContent>
                </Popover>
              </div>
              <Input
                id="retirementIncome"
                type="number"
                step="0.01"
                value={data.retirementIncome !== undefined ? data.retirementIncome.toString() : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleDataChange('retirementIncome', undefined);
                  } else {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue)) {
                      handleDataChange('retirementIncome', numValue);
                    }
                  }
                }}
                placeholder="0"
                className="border-2 border-[#B3EBEF] focus:border-[#B3EBEF] focus:ring-[#B3EBEF]/40"
              />
            </div>
          )}

          {/* 未退休状态下的详细信息录入 */}
          {(data.currentStatus || 'not-retired') === 'not-retired' && (
            <>
              <div className="grid grid-cols-2 gap-4 relative z-10">
            <div className="space-y-2">
              <Label htmlFor="currentIncome" className="text-gray-700 font-medium">当前收入（万元/年）</Label>
              <Input
                id="currentIncome"
                type="number"
                step="0.1"
                value={data.currentIncome !== undefined && data.currentIncome !== null ? data.currentIncome.toString() : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    handleDataChange('currentIncome', 0);
                  } else {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue)) {
                      handleDataChange('currentIncome', numValue);
                    }
                  }
                }}
                placeholder="请输入当前年收入"
                className="border-2 border-[#B3EBEF] focus:border-[#B3EBEF] focus:ring-[#B3EBEF]/40"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="retirementAge" className="text-gray-700 font-medium">预计法定退休年龄</Label>
              <Select 
                value={data.retirementAge?.toString() || "60"} 
                onValueChange={(value) => handleDataChange('retirementAge', parseInt(value))}
              >
                <SelectTrigger className="border-2 border-[#B3EBEF] focus:border-[#B3EBEF] focus:ring-[#B3EBEF]/40">
                  <SelectValue placeholder="请选择退休年龄" />
                </SelectTrigger>
                <SelectContent className="max-h-60 overflow-y-auto">
                  {(() => {
                    const minAge = Math.max(data.currentAge || 30, 50);
                    const maxAge = 85;
                    const ageCount = maxAge - minAge + 1;
                    return Array.from({ length: ageCount }, (_, i) => i + minAge).map((age) => (
                      <SelectItem key={age} value={age.toString()}>
                        {age}岁
                      </SelectItem>
                    ));
                  })()}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 relative z-10">
            <Label className="text-gray-700 font-medium">预计未来收入变化</Label>
            <RadioGroup
              value={data.incomeChange || 'stable'}
              onValueChange={(value) => handleDataChange('incomeChange', value)}
              className="mt-1 grid grid-cols-2 gap-2"
            >
              <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-[#CAF4F7]/20 transition-colors">
                <RadioGroupItem value="stable" id="stable" className="border-2 border-[#B3EBEF] data-[state=checked]:border-[#01BCD6] data-[state=checked]:text-[#01BCD6]" />
                <Label htmlFor="stable" className="cursor-pointer">保持不变</Label>
              </div>
              <div className="flex items-center space-x-2 p-2 rounded-lg hover:bg-[#CAF4F7]/20 transition-colors">
                <RadioGroupItem value="fluctuation" id="fluctuation" className="border-2 border-[#B3EBEF] data-[state=checked]:border-[#01BCD6] data-[state=checked]:text-[#01BCD6]" />
                <Label htmlFor="fluctuation" className="cursor-pointer">收入波动</Label>
              </div>
            </RadioGroup>
          </div>

           {/* 收入波动配置 */}
           {data.incomeChange === 'fluctuation' && (
             <div className="space-y-3">
               <div className="flex items-center justify-between">
                 <Label>收入波动配置</Label>
                 <Button
                   type="button"
                   variant="outline"
                   size="sm"
                   onClick={addFluctuation}
                   className="flex items-center gap-1"
                 >
                   <Plus className="w-4 h-4" />
                   添加波动期
                 </Button>
               </div>
               
               {fluctuations.map((fluctuation) => (
                 <Card key={fluctuation.id} className="p-3">
                   <div className="grid grid-cols-[2fr_2fr_2fr_auto] gap-2 items-end">
                     <div>
                       <Label className="text-xs">开始年龄</Label>
                       <Select 
                         value={fluctuation.startYear.toString()} 
                         onValueChange={(value) => updateFluctuation(fluctuation.id, 'startYear', parseInt(value))}
                       >
                         <SelectTrigger className="border-2 border-[#B3EBEF] focus:border-[#B3EBEF] focus:ring-[#B3EBEF]/40">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent className="max-h-60 overflow-y-auto bg-white z-50">
                           {Array.from({ length: data.retirementAge - data.currentAge + 1 }, (_, i) => data.currentAge + i).map((age) => (
                             <SelectItem key={age} value={age.toString()}>
                               {age}岁
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                     <div>
                       <Label className="text-xs">结束年龄</Label>
                       <Select 
                         value={fluctuation.endYear.toString()} 
                         onValueChange={(value) => updateFluctuation(fluctuation.id, 'endYear', parseInt(value))}
                       >
                         <SelectTrigger className="border-2 border-[#B3EBEF] focus:border-[#B3EBEF] focus:ring-[#B3EBEF]/40">
                           <SelectValue />
                         </SelectTrigger>
                          <SelectContent className="max-h-60 overflow-y-auto bg-white z-50">
                            {Array.from({ length: data.retirementAge - data.currentAge }, (_, i) => data.currentAge + i).map((age) => (
                             <SelectItem key={age} value={age.toString()}>
                               {age}岁
                             </SelectItem>
                           ))}
                         </SelectContent>
                       </Select>
                     </div>
                     <div>
                       <Label className="text-xs">增长率（%）</Label>
                       <Input
                         type="number"
                         step="0.1"
                         value={growthRateInputs[fluctuation.id] ?? fluctuation.growthRate.toString()}
                         onChange={(e) => {
                           const v = e.target.value;
                           setGrowthRateInputs((prev) => ({ ...prev, [fluctuation.id]: v }));
                           if (v === '' || v === '-' || v === '+') return;
                           const num = parseFloat(v);
                           if (!isNaN(num)) {
                             updateFluctuation(fluctuation.id, 'growthRate', num);
                           }
                         }}
                         onBlur={() => {
                           const v = growthRateInputs[fluctuation.id];
                           const num = parseFloat(v);
                           if (v === '' || v === '-' || v === '+' || isNaN(num)) {
                             setGrowthRateInputs((prev) => ({ ...prev, [fluctuation.id]: '0' }));
                             updateFluctuation(fluctuation.id, 'growthRate', 0);
                           }
                         }}
                         placeholder="支持正负值"
                         className="border-2 border-[#B3EBEF] focus:border-[#B3EBEF] focus:ring-[#B3EBEF]/40"
                       />
                     </div>
                      <div className="flex justify-start">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFluctuation(fluctuation.id)}
                          className="text-red-500 hover:text-red-700 w-auto px-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                   </div>
                 </Card>
               ))}
             </div>
            )}

            {/* 预计退休工资 */}
            <div className="space-y-2 relative z-10">
              <Label htmlFor="expectedRetirementSalary" className="text-gray-700 font-medium">预计退休工资（元/月）</Label>
               <Input
                 id="expectedRetirementSalary"
                 type="number"
                 step="1"
                  value={retirementSalaryEdited ? 
                    (data.expectedRetirementSalary !== undefined ? data.expectedRetirementSalary.toString() : '') :
                    (data.expectedRetirementSalary !== undefined ? data.expectedRetirementSalary.toString() : 
                      Math.round(Math.max(0, (data.currentIncome || 0)) * 10000 / 12 * 0.3).toString())}
                  onChange={(e) => {
                    setRetirementSalaryEdited(true);
                    const value = e.target.value;
                    if (value === '') {
                      handleDataChange('expectedRetirementSalary', 0);
                    } else {
                      const numValue = parseFloat(value);
                      if (!isNaN(numValue)) {
                        handleDataChange('expectedRetirementSalary', numValue);
                      }
                    }
                  }}
                 placeholder="0"
                 className="border-2 border-[#B3EBEF] focus:border-[#B3EBEF] focus:ring-[#B3EBEF]/40"
               />
            </div>
           </>
           )}
         </CardContent>
      </Card>

      {/* 工资收入速算表 - 必输项目未完成时显示空表，收入波动模式不显示 */}
      {(data.currentStatus || 'not-retired') === 'not-retired' && !isFormValid() && data.incomeChange !== 'fluctuation' && (
        <Card className="bg-[#CAF4F7]/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-center text-gray-700">工资收入速算表</CardTitle>
          </CardHeader>
          <CardContent className="px-6">
            <div className="text-center text-gray-500 py-4 -mt-2">
              <p>请完成上方必输项目后查看收入预测表</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 收入预测表 - 只在未退休状态下显示 */}
      {(data.currentStatus || 'not-retired') === 'not-retired' && 
       typeof data.currentIncome === 'number' && 
       Number.isFinite(data.currentIncome) && 
       data.currentIncome > 0 && 
       data.retirementAge > data.currentAge && (
        <Card className="bg-[#CAF4F7]/20">
          <CardContent className="p-0">
            <div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center w-1/3">年龄</TableHead>
                    <TableHead className="text-center w-1/3">收入（万元）</TableHead>
                    <TableHead className="text-center w-1/3">增长率（%）</TableHead>
                  </TableRow>
                </TableHeader>
                  <TableBody>
                    {incomeTable
                      .map((row) => {
                        // 检查当前年份是否在波动期内
                        const isInFluctuationPeriod = data.incomeChange === 'fluctuation' && 
                          fluctuations.some(f => row.year >= f.startYear && row.year <= f.endYear);
                        
                        return (
                           <TableRow 
                            key={row.year}
                            className={
                              row.isRetired 
                                ? `${row.year < 85 ? 'border-l-4 border-[#B3EBEF]' : ''}`
                                : isInFluctuationPeriod 
                                  ? "bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-400" 
                                  : ""
                            }
                          >
                             <TableCell className={`text-center ${row.isRetired ? 'text-black' : isInFluctuationPeriod ? 'font-medium text-orange-800' : ''}`}>
                               {row.year}岁
                               {row.isRetired && (
                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[#B3EBEF] text-gray-700 border border-gray-200">
                                  退休收入
                                </span>
                               )}
                               {!row.isRetired && isInFluctuationPeriod && (
                                 <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${
                                   row.growthRate > 0 
                                     ? 'bg-green-100 text-green-800 border-green-200' 
                                     : 'bg-red-100 text-red-800 border-red-200'
                                 }`}>
                                   {row.growthRate > 0 ? '收入上升' : '收入下降'}
                                 </span>
                               )}
                            </TableCell>
                            <TableCell className={`text-center ${row.isRetired ? 'text-black' : isInFluctuationPeriod ? 'font-medium text-orange-800' : ''}`}>
                              {row.income.toFixed(1)}
                            </TableCell>
                            <TableCell className={`text-center ${row.isRetired ? 'text-black' : isInFluctuationPeriod ? 'font-medium text-orange-800' : ''}`}>
                              {row.growthRate.toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
              </Table>
             </div>
           </CardContent>
         </Card>
       )}
    </>
  );
};

export default SimpleCareerIncomeForm;