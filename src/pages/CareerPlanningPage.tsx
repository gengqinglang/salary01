import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Coins, User, Users, ArrowLeft } from 'lucide-react';
import SimpleCareerIncomeForm from '@/components/career/SimpleCareerIncomeForm';
import CareerSummaryStats from '@/components/career/CareerSummaryStats';
import { SimplifiedCareerDataProvider, useCareerData } from '@/components/career/SimplifiedCareerDataProvider';
import MobileHint from '@/components/ui/mobile-hint';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface CareerIncomeData {
  currentAge: number;
  currentIncome: number;
  retirementAge: number;
  incomeChange: 'continuous-growth' | 'stable' | 'fluctuation' | 'continuous-decline';
  continuousGrowthRate?: number;
  continuousDeclineRate?: number;
  fluctuations: Array<{
    id: string;
    startYear: number;
    endYear: number;
    growthRate: number;
  }>;
  expectedRetirementSalary?: number; // 预计退休工资（元/月）
}

const CareerPlanningContent = () => {
  const navigate = useNavigate();
  
  const { 
    personalTotalIncome, 
    partnerTotalIncome, 
    combinedTotalIncome, 
    personalProgressiveIncome,
    partnerProgressiveIncome,
    combinedProgressiveIncome,
    personalCompleteness,
    partnerCompleteness,
    formatToWan,
    setPersonalCurrentIncome,
    setPersonalRetirementAge,
    setPartnerCurrentIncome,
    setPartnerRetirementAge
  } = useCareerData();
  
  const [activeTab, setActiveTab] = useState<'personal' | 'partner'>('personal');
  
  // 保存状态
  const [personalSaved, setPersonalSaved] = useState(false);
  const [partnerSaved, setPartnerSaved] = useState(false);

  // 保存后用于汇总卡片的本地累计收入（元）
  const [personalFormProgressiveIncome, setPersonalFormProgressiveIncome] = useState(0);
  const [partnerFormProgressiveIncome, setPartnerFormProgressiveIncome] = useState(0);

  // 本人数据
  const [personalData, setPersonalData] = useState<CareerIncomeData>({
    currentAge: 30,
    currentIncome: 0,
    retirementAge: 60,
    incomeChange: 'continuous-growth',
    continuousGrowthRate: 1,
    continuousDeclineRate: 1,
    fluctuations: []
  });

  // 伴侣数据
  const [partnerData, setPartnerData] = useState<CareerIncomeData>({
    currentAge: 30,
    currentIncome: 0,
    retirementAge: 60,
    incomeChange: 'continuous-growth',
    continuousGrowthRate: 1,
    continuousDeclineRate: 1,
    fluctuations: []
  });

  // 计算表单累计收入（元）
  const computeProgressiveIncomeFromForm = (d: CareerIncomeData) => {
    if (!d || d.currentIncome <= 0 || d.retirementAge <= d.currentAge) return 0;
    let totalWan = 0;
    const years = d.retirementAge - d.currentAge;
    
    // 计算退休前收入（不包含退休当年）
    for (let i = 0; i < years; i++) {
      const year = d.currentAge + i;
      let incomeWan = d.currentIncome;
      if (d.incomeChange === 'continuous-growth') {
        const rate = (d.continuousGrowthRate || 1) / 100;
        incomeWan = d.currentIncome * Math.pow(1 + rate, i);
      } else if (d.incomeChange === 'continuous-decline') {
        const rate = (d.continuousDeclineRate || 1) / 100;
        incomeWan = d.currentIncome * Math.pow(1 - rate, i);
      } else if (d.incomeChange === 'fluctuation') {
        const f = d.fluctuations.find(f => year >= f.startYear && year <= f.endYear);
        if (f) {
          const yearsInPeriod = year - f.startYear;
          incomeWan = d.currentIncome * Math.pow(1 + f.growthRate / 100, yearsInPeriod);
        } else {
          incomeWan = d.currentIncome;
        }
      } else {
        incomeWan = d.currentIncome;
      }
      totalWan += incomeWan;
    }
    
    // 计算退休后收入（从退休年龄到85岁）
    if (d.expectedRetirementSalary && d.expectedRetirementSalary > 0) {
      const retirementYears = 85 - d.retirementAge + 1; // 从退休年龄到85岁（包含退休当年）
      const annualRetirementIncome = d.expectedRetirementSalary * 12; // 月薪转年薪（元）
      totalWan += (annualRetirementIncome / 10000) * retirementYears; // 转换为万元
    }
    
    return Math.round(totalWan * 10000);
  };

  const goToNext = () => {
    navigate('/future-income');
  };

  const handleBackToHomepage = () => {
    window.location.href = 'https://gengqinglang.github.io/financial-tools-homepage/';
  };

  const handlePersonalDataChange = (data: CareerIncomeData) => {
    setPersonalData(data);
    // 数据变化时重置保存状态
    setPersonalSaved(false);
  };

  const handlePartnerDataChange = (data: CareerIncomeData) => {
    setPartnerData(data);
    // 数据变化时重置保存状态
    setPartnerSaved(false);
  };

  // 保存个人数据到全局状态
  const handlePersonalSave = () => {
    setPersonalSaved(true);
    // 同步到全局状态
    setPersonalCurrentIncome(personalData.currentIncome.toString());
    setPersonalRetirementAge(personalData.retirementAge.toString());
    // 计算并写入本地累计收入（元）
    setPersonalFormProgressiveIncome(computeProgressiveIncomeFromForm(personalData));
  };

  // 保存伴侣数据到全局状态
  const handlePartnerSave = () => {
    setPartnerSaved(true);
    // 同步到全局状态
    setPartnerCurrentIncome(partnerData.currentIncome.toString());
    setPartnerRetirementAge(partnerData.retirementAge.toString());
    // 计算并写入本地累计收入（元）
    setPartnerFormProgressiveIncome(computeProgressiveIncomeFromForm(partnerData));
  };

  // 验证单个人的表单完整性
  const isPersonDataValid = (data: CareerIncomeData) => {
    return data.currentIncome >= 0 && 
           data.retirementAge > data.currentAge;
  };

  // 两个人的数据都必须完整且已保存
  const isBothFormsValid = () => {
    const personalValid = isPersonDataValid(personalData) && personalSaved;
    const partnerValid = isPersonDataValid(partnerData) && partnerSaved;
    return personalValid && partnerValid;
  };

  const getHintMessage = () => {
    const personalValid = isPersonDataValid(personalData);
    const partnerValid = isPersonDataValid(partnerData);
    
    if (!personalValid && !partnerValid) {
      return '请完成本人和伴侣的收入信息并保存';
    } else if (!personalValid) {
      return '请完成本人的收入信息';
    } else if (!partnerValid) {
      return '请完成伴侣的收入信息';
    } else if (!personalSaved || !partnerSaved) {
      return '请点击保存按钮确认信息';
    }
    return '';
  };

  return (
    <div className="min-h-screen bg-[#F4FDFD] flex flex-col">
      <div className="relative flex flex-col bg-white/90 backdrop-blur-xl flex-1">
        {/* 标题区域 */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#B3EBEF]/20 via-white/60 to-[#B3EBEF]/20 -mx-2">
          {/* 返回按钮 */}
          <button
            onClick={handleBackToHomepage}
            className="absolute top-4 left-4 z-10 w-8 h-8 bg-[#B3EBEF] rounded-full flex items-center justify-center hover:bg-[#8FD8DC] transition-colors shadow-md"
            aria-label="返回工具首页"
          >
            <ArrowLeft className="w-4 h-4 text-black" />
          </button>
          
          <div className="relative py-6 text-center flex flex-col justify-center" style={{ minHeight: '80px' }}>
            <div className="flex items-center justify-center mb-2">
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">
                工资收入
              </h1>
            </div>
            
            {/* Summary Stats - 恢复三个收入卡片 */}
            <div className="px-3 mt-4">
              <CareerSummaryStats
                personalTotalIncome={personalTotalIncome}
                partnerTotalIncome={partnerTotalIncome}
                combinedTotalIncome={combinedTotalIncome}
                personalProgressiveIncome={personalFormProgressiveIncome || personalProgressiveIncome}
                partnerProgressiveIncome={partnerFormProgressiveIncome || partnerProgressiveIncome}
                combinedProgressiveIncome={(personalFormProgressiveIncome || personalProgressiveIncome) + (partnerFormProgressiveIncome || partnerProgressiveIncome)}
                personalCompleteness={personalCompleteness}
                partnerCompleteness={partnerCompleteness}
                formatToWan={formatToWan}
              />
            </div>
          </div>
          
          {/* 调试模块：本人工资收入计算过程 */}
          <div className="mt-4 mx-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-sm font-bold text-gray-800 mb-3">🔍 本人工资收入计算过程（调试用）</h3>
            <div className="space-y-3 text-xs text-gray-700">
              {/* 基本信息 */}
              <div className="bg-white p-3 rounded border">
                <div className="font-semibold mb-2">基本信息：</div>
                <div>当前年龄：{personalData.currentAge}岁</div>
                <div>当前收入：{personalData.currentIncome}万元/年</div>
                <div>退休年龄：{personalData.retirementAge}岁</div>
                <div>预计退休工资：{personalData.expectedRetirementSalary || '未设置'}元/月</div>
                <div>收入变化：{
                  personalData.incomeChange === 'continuous-growth' ? '持续增长' :
                  personalData.incomeChange === 'stable' ? '保持不变' :
                  personalData.incomeChange === 'continuous-decline' ? '持续下降' :
                  personalData.incomeChange === 'fluctuation' ? '收入波动' : '未知'
                }</div>
              </div>

              {/* 退休前收入计算 */}
              <div className="bg-white p-3 rounded border">
                <div className="font-semibold mb-2">退休前收入计算（{personalData.currentAge}岁 到 {personalData.retirementAge-1}岁）：</div>
                {(() => {
                  const years = personalData.retirementAge - personalData.currentAge;
                  let preRetirementTotal = 0;
                  const yearlyDetails = [];
                  
                  for (let i = 0; i < years; i++) {
                    const year = personalData.currentAge + i;
                    let income = personalData.currentIncome;
                    
                    if (personalData.incomeChange === 'continuous-growth') {
                      const rate = (personalData.continuousGrowthRate || 1) / 100;
                      income = personalData.currentIncome * Math.pow(1 + rate, i);
                    } else if (personalData.incomeChange === 'continuous-decline') {
                      const rate = (personalData.continuousDeclineRate || 1) / 100;
                      income = personalData.currentIncome * Math.pow(1 - rate, i);
                    } else if (personalData.incomeChange === 'fluctuation') {
                      const f = personalData.fluctuations.find(f => year >= f.startYear && year <= f.endYear);
                      if (f) {
                        const yearsInPeriod = year - f.startYear;
                        income = personalData.currentIncome * Math.pow(1 + f.growthRate / 100, yearsInPeriod);
                      }
                    }
                    
                    preRetirementTotal += income;
                    if (i < 3 || i >= years - 3) { // 只显示前3年和后3年
                      yearlyDetails.push(`${year}岁: ${income.toFixed(1)}万元`);
                    } else if (i === 3) {
                      yearlyDetails.push('...');
                    }
                  }
                  
                  return (
                    <div>
                      <div>工作年数：{years}年</div>
                      <div>年度收入详情：{yearlyDetails.join(', ')}</div>
                      <div className="font-bold">退休前总收入：{preRetirementTotal.toFixed(1)}万元</div>
                    </div>
                  );
                })()}
              </div>

              {/* 退休后收入计算 */}
              <div className="bg-white p-3 rounded border">
                <div className="font-semibold mb-2">退休后收入计算（{personalData.retirementAge}岁 到 85岁）：</div>
                {(() => {
                  if (!personalData.expectedRetirementSalary || personalData.expectedRetirementSalary <= 0) {
                    return <div className="text-gray-500">未设置退休工资，退休后收入为0</div>;
                  }
                  
                  const retirementYears = 85 - personalData.retirementAge + 1;
                  const monthlyRetirement = personalData.expectedRetirementSalary;
                  const annualRetirement = monthlyRetirement * 12;
                  const totalRetirementIncome = (annualRetirement / 10000) * retirementYears;
                  
                  return (
                    <div>
                      <div>退休年数：{retirementYears}年</div>
                      <div>月退休工资：{monthlyRetirement}元</div>
                      <div>年退休收入：{monthlyRetirement} × 12 = {annualRetirement.toLocaleString()}元 = {(annualRetirement/10000).toFixed(1)}万元</div>
                      <div className="font-bold">退休后总收入：{(annualRetirement/10000).toFixed(1)} × {retirementYears} = {totalRetirementIncome.toFixed(1)}万元</div>
                    </div>
                  );
                })()}
              </div>

              {/* 总收入汇总 */}
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <div className="font-semibold mb-2 text-blue-800">总收入汇总：</div>
                {(() => {
                  const computed = computeProgressiveIncomeFromForm(personalData);
                  const years = personalData.retirementAge - personalData.currentAge;
                  let preRetirementTotal = 0;
                  
                  // 重新计算退休前收入
                  for (let i = 0; i < years; i++) {
                    const year = personalData.currentAge + i;
                    let income = personalData.currentIncome;
                    
                    if (personalData.incomeChange === 'continuous-growth') {
                      const rate = (personalData.continuousGrowthRate || 1) / 100;
                      income = personalData.currentIncome * Math.pow(1 + rate, i);
                    } else if (personalData.incomeChange === 'continuous-decline') {
                      const rate = (personalData.continuousDeclineRate || 1) / 100;
                      income = personalData.currentIncome * Math.pow(1 - rate, i);
                    } else if (personalData.incomeChange === 'fluctuation') {
                      const f = personalData.fluctuations.find(f => year >= f.startYear && year <= f.endYear);
                      if (f) {
                        const yearsInPeriod = year - f.startYear;
                        income = personalData.currentIncome * Math.pow(1 + f.growthRate / 100, yearsInPeriod);
                      }
                    }
                    preRetirementTotal += income;
                  }
                  
                  // 计算退休后收入
                  let postRetirementTotal = 0;
                  if (personalData.expectedRetirementSalary && personalData.expectedRetirementSalary > 0) {
                    const retirementYears = 85 - personalData.retirementAge + 1;
                    const annualRetirementIncome = personalData.expectedRetirementSalary * 12;
                    postRetirementTotal = (annualRetirementIncome / 10000) * retirementYears;
                  }
                  
                  return (
                    <div className="text-blue-800">
                      <div>退休前收入：{preRetirementTotal.toFixed(1)}万元</div>
                      <div>退休后收入：{postRetirementTotal.toFixed(1)}万元</div>
                      <div className="font-bold text-lg">总收入：{(preRetirementTotal + postRetirementTotal).toFixed(1)}万元 = {Math.round((preRetirementTotal + postRetirementTotal) * 10000).toLocaleString()}元</div>
                      <div className="text-sm">函数返回值：{computed.toLocaleString()}元</div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-visible pb-20">
          <div className="pt-4 space-y-6">
            {/* 收入录入表单 */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'personal' | 'partner')}>
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-white shadow-sm border border-[#01BCD6]">
                <TabsTrigger value="personal" className="flex items-center gap-2 data-[state=active]:bg-[#B3EBEF] data-[state=active]:text-gray-800 text-gray-700 font-medium relative">
                  <User className="w-4 h-4" />
                  <span>本人</span>
                </TabsTrigger>
                <TabsTrigger value="partner" className="flex items-center gap-2 data-[state=active]:bg-[#B3EBEF] data-[state=active]:text-gray-800 text-gray-700 font-medium relative">
                  <Users className="w-4 h-4" />
                  <span>伴侣</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="personal" className="mt-0">
                <div className="space-y-4">
                  <SimpleCareerIncomeForm 
                    data={personalData}
                    onChange={handlePersonalDataChange}
                    onSave={handlePersonalSave}
                    isSaved={personalSaved}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="partner" className="mt-0">
                <div className="space-y-4">
                  {/* 提示信息卡片 */}
                  <div className="p-3 rounded-lg text-sm leading-relaxed" style={{ backgroundColor: 'rgba(202, 244, 247, 0.2)', color: '#01BCD6' }}>
                    <span className="font-bold">提示信息</span>：未来伴侣的收入水平会显著影响家庭财务状况，系统已将未来伴侣的收入水平默认设置为与您本人一致，您可根据实际情况进行调整。
                  </div>
                  
                  <SimpleCareerIncomeForm 
                    data={partnerData}
                    onChange={handlePartnerDataChange}
                    onSave={handlePartnerSave}
                    isSaved={partnerSaved}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

      </div>
    </div>
  );
};

const CareerPlanningPage = () => {
  return (
    <SimplifiedCareerDataProvider>
      <CareerPlanningContent />
    </SimplifiedCareerDataProvider>
  );
};

export default CareerPlanningPage;
