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
  incomeChange: 'stable' | 'fluctuation';
  fluctuations: Array<{
    id: string;
    startYear: number;
    endYear: number;
    growthRate: number;
  }>;
  expectedRetirementSalary?: number; // 预计退休工资（元/月）
  currentStatus?: 'retired' | 'not-retired'; // 当前状态
  retirementIncome?: number; // 退休金（元/月）
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
    incomeChange: 'stable',
    fluctuations: []
  });

  // 伴侣数据
  const [partnerData, setPartnerData] = useState<CareerIncomeData>({
    currentAge: 30,
    currentIncome: 0,
    retirementAge: 60,
    incomeChange: 'stable',
    fluctuations: []
  });

  // 计算表单累计收入（元）
  const computeProgressiveIncomeFromForm = (d: CareerIncomeData) => {
    if (!d) return 0;

    // 安全数值处理
    const currentAge = Number.isFinite(d.currentAge) ? d.currentAge : 0;
    const retirementAge = Number.isFinite(d.retirementAge) ? d.retirementAge : 0;
    const currentIncomeWan = Number.isFinite(d.currentIncome) ? d.currentIncome : 0;

    let totalWan = 0;

    // 已退休：使用退休金
    if (d.currentStatus === 'retired') {
      const monthlyRetirement = Number.isFinite(d.retirementIncome as number) && d.retirementIncome !== undefined
        ? (d.retirementIncome as number)
        : 0;
      if (monthlyRetirement > 0) {
        const retirementYears = Math.max(0, 85 - currentAge + 1);
        const annualRetirementIncome = monthlyRetirement * 12; // 元/年
        totalWan = (annualRetirementIncome / 10000) * retirementYears; // 万元
      }
      return Math.round(totalWan * 10000);
    }

    // 未退休：若关键值无效，直接返回0
    if (currentIncomeWan <= 0 || retirementAge <= currentAge) return 0;

    const years = Math.max(0, retirementAge - currentAge);

    // 退休前收入（不包含退休当年）
    for (let i = 0; i < years; i++) {
      const year = currentAge + i;
      let incomeWan = currentIncomeWan;

      if (d.incomeChange === 'fluctuation') {
        const f = d.fluctuations?.find(f => year >= f.startYear && year <= f.endYear);
        if (f) {
          const yearsInPeriod = Math.max(0, year - f.startYear);
          const rate = (f.growthRate ?? 0) / 100;
          incomeWan = currentIncomeWan * Math.pow(1 + rate, yearsInPeriod);
        } else {
          incomeWan = currentIncomeWan;
        }
      } else {
        incomeWan = currentIncomeWan;
      }

      incomeWan = Number.isFinite(incomeWan) ? incomeWan : 0;
      totalWan += incomeWan;
    }

    // 退休后收入（从退休年龄到85岁）
    const retirementSalary = d.expectedRetirementSalary !== undefined 
      ? Number(d.expectedRetirementSalary) 
      : currentIncomeWan * 10000 / 12 * 0.3;

    const safeRetirementSalary = Number.isFinite(retirementSalary) ? retirementSalary : 0;

    if (safeRetirementSalary > 0) {
      const retirementYears = Math.max(0, 85 - retirementAge + 1);
      const annualRetirementIncome = safeRetirementSalary * 12; // 元/年
      totalWan += (annualRetirementIncome / 10000) * retirementYears; // 万元
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
    setPersonalCurrentIncome(personalData.currentIncome?.toString() || '');
    setPersonalRetirementAge(personalData.retirementAge?.toString() || '60');
    // 计算并写入本地累计收入（元）
    setPersonalFormProgressiveIncome(computeProgressiveIncomeFromForm(personalData));
  };

  // 保存伴侣数据到全局状态
  const handlePartnerSave = () => {
    setPartnerSaved(true);
    // 同步到全局状态
    setPartnerCurrentIncome(partnerData.currentIncome?.toString() || '');
    setPartnerRetirementAge(partnerData.retirementAge?.toString() || '60');
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
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                工资收入计算器
              </h1>
            </div>
            
            {/* Summary Stats - 恢复三个收入卡片 */}
            <div className="px-3 mt-4">
              <CareerSummaryStats
                personalTotalIncome={personalTotalIncome}
                partnerTotalIncome={partnerTotalIncome}
                combinedTotalIncome={combinedTotalIncome}
                personalProgressiveIncome={computeProgressiveIncomeFromForm(personalData)}
                partnerProgressiveIncome={computeProgressiveIncomeFromForm(partnerData)}
                combinedProgressiveIncome={computeProgressiveIncomeFromForm(personalData) + computeProgressiveIncomeFromForm(partnerData)}
                personalCompleteness={personalCompleteness}
                partnerCompleteness={partnerCompleteness}
                formatToWan={formatToWan}
              />
            </div>
          </div>
          
          {/* 调试模块：详细计算过程展示 */}
          <div className="hidden mt-4 mx-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
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
                  personalData.incomeChange === 'stable' ? '保持不变' :
                  personalData.incomeChange === 'fluctuation' ? '收入波动' : '未知'
                }</div>
                <div>保存状态：{personalSaved ? '已保存' : '未保存'}</div>
              </div>

              {/* 退休前收入详细计算 */}
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <div className="font-semibold mb-2 text-blue-800">退休前工资计算过程（{personalData.currentAge}岁 到 {personalData.retirementAge-1}岁）：</div>
                {(() => {
                  const years = personalData.retirementAge - personalData.currentAge;
                  let preRetirementTotal = 0;
                  const yearlyDetails = [];
                  
                  for (let i = 0; i < years; i++) {
                    const currentYear = personalData.currentAge + i;
                    let yearlyIncome = personalData.currentIncome;
                    
                    if (personalData.incomeChange === 'fluctuation') {
                      const f = personalData.fluctuations.find(f => currentYear >= f.startYear && currentYear <= f.endYear);
                      if (f) {
                        const yearsInPeriod = currentYear - f.startYear;
                        yearlyIncome = personalData.currentIncome * Math.pow(1 + f.growthRate / 100, yearsInPeriod);
                      }
                    }
                    
                    preRetirementTotal += yearlyIncome;
                    
                    // 显示所有年份的详情，但超过10行时省略中间部分
                    if (years <= 10 || i < 5 || i >= years - 5) {
                      yearlyDetails.push(`${currentYear}岁: ${yearlyIncome.toFixed(2)}万元`);
                    } else if (i === 5) {
                      yearlyDetails.push('...');
                    }
                  }
                  
                  return (
                    <div className="text-blue-800">
                      <div className="mb-2">
                        <strong>工作年限：</strong>{years}年 (从{personalData.currentAge}岁到{personalData.retirementAge-1}岁)
                      </div>
                      <div className="mb-2">
                        <strong>每年收入明细：</strong>
                      </div>
                      <div className="pl-2 mb-2 text-xs bg-white/50 p-2 rounded border max-h-32 overflow-y-auto">
                        {yearlyDetails.map((detail, index) => (
                          <div key={index}>{detail}</div>
                        ))}
                      </div>
                      <div className="font-bold text-base border-t pt-2">
                        退休前总收入：{preRetirementTotal.toFixed(2)}万元
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* 退休后收入详细计算 */}
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <div className="font-semibold mb-2 text-green-800">退休后工资计算过程（{personalData.retirementAge}岁 到 85岁）：</div>
                {(() => {
                  // 如果没有设置退休工资，使用默认值：当前收入的30%
                  const retirementSalary = personalData.expectedRetirementSalary !== undefined 
                    ? Number(personalData.expectedRetirementSalary) 
                    : personalData.currentIncome * 10000 / 12 * 0.3;
                  
                  if (retirementSalary <= 0) {
                    return (
                      <div className="text-green-800">
                        <div className="text-gray-600">未设置退休工资，退休后收入为0万元</div>
                        <div className="font-bold text-base border-t pt-2 mt-2">
                          退休后总收入：0.00万元
                        </div>
                      </div>
                    );
                  }
                  
                  const retirementYears = 85 - personalData.retirementAge + 1; // 包含退休当年
                  const monthlyRetirement = retirementSalary; // 元/月
                  const annualRetirement = monthlyRetirement * 12; // 元/年
                  const annualRetirementWan = annualRetirement / 10000; // 万元/年
                  const totalRetirementIncome = annualRetirementWan * retirementYears; // 万元
                  
                  return (
                    <div className="text-green-800">
                      <div className="mb-2">
                        <strong>退休年限：</strong>{retirementYears}年 (从{personalData.retirementAge}岁到85岁)
                      </div>
                      <div className="mb-2">
                        <strong>计算过程：</strong>
                      </div>
                      <div className="pl-2 mb-2 text-xs bg-white/50 p-2 rounded border">
                        <div>月退休工资：{monthlyRetirement.toLocaleString()}元/月</div>
                        <div>年退休收入：{monthlyRetirement.toLocaleString()} × 12 = {annualRetirement.toLocaleString()}元/年</div>
                        <div>年退休收入：{annualRetirement.toLocaleString()}元 = {annualRetirementWan.toFixed(2)}万元/年</div>
                        <div>总退休收入：{annualRetirementWan.toFixed(2)} × {retirementYears} = {totalRetirementIncome.toFixed(2)}万元</div>
                      </div>
                      <div className="font-bold text-base border-t pt-2">
                        退休后总收入：{totalRetirementIncome.toFixed(2)}万元
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* 总收入汇总 */}
              <div className="bg-red-50 p-3 rounded border border-red-200">
                <div className="font-semibold mb-2 text-red-800">总收入汇总计算：</div>
                {(() => {
                  // 重新计算退休前收入
                  const years = personalData.retirementAge - personalData.currentAge;
                  let preRetirementTotal = 0;
                  
                  for (let i = 0; i < years; i++) {
                    const currentYear = personalData.currentAge + i;
                    let yearlyIncome = personalData.currentIncome;
                    
                    if (personalData.incomeChange === 'fluctuation') {
                      const f = personalData.fluctuations.find(f => currentYear >= f.startYear && currentYear <= f.endYear);
                      if (f) {
                        const yearsInPeriod = currentYear - f.startYear;
                        yearlyIncome = personalData.currentIncome * Math.pow(1 + f.growthRate / 100, yearsInPeriod);
                      }
                    }
                    preRetirementTotal += yearlyIncome;
                  }
                  
                  // 重新计算退休后收入
                  let postRetirementTotal = 0;
                  // 如果没有设置退休工资，使用默认值：当前收入的30%
                  const retirementSalary = personalData.expectedRetirementSalary !== undefined 
                    ? Number(personalData.expectedRetirementSalary) 
                    : personalData.currentIncome * 10000 / 12 * 0.3;
                  const isDefaultRetirementSalary = personalData.expectedRetirementSalary === undefined;
                  
                  if (retirementSalary > 0) {
                    const retirementYears = 85 - personalData.retirementAge + 1;
                    const annualRetirementIncome = retirementSalary * 12;
                    postRetirementTotal = (annualRetirementIncome / 10000) * retirementYears;
                  }
                  
                  const grandTotal = preRetirementTotal + postRetirementTotal;
                  const grandTotalYuan = Math.round(grandTotal * 10000);
                  
                  // 获取函数计算结果进行对比
                  const functionResult = computeProgressiveIncomeFromForm(personalData);
                  
                  return (
                    <div className="text-red-800">
                      <div className="mb-2">
                        <strong>计算汇总：</strong>
                      </div>
                      <div className="pl-2 mb-2 text-xs bg-white/50 p-2 rounded border">
                        <div>退休前总收入：{preRetirementTotal.toFixed(2)}万元</div>
                        <div>退休后总收入：{postRetirementTotal.toFixed(2)}万元</div>
                        <div className="text-xs text-gray-600 mt-1">
                          退休工资：{retirementSalary.toFixed(0)}元/月 {isDefaultRetirementSalary ? '(默认值)' : '(用户设置)'}
                        </div>
                        <div className="border-t pt-1 mt-1">
                          <div>两者相加：{preRetirementTotal.toFixed(2)} + {postRetirementTotal.toFixed(2)} = {grandTotal.toFixed(2)}万元</div>
                          <div>转换为元：{grandTotal.toFixed(2)}万元 = {grandTotalYuan.toLocaleString()}元</div>
                        </div>
                      </div>
                      <div className="font-bold text-lg border-t pt-2">
                        最终总收入：{grandTotal.toFixed(2)}万元 = {grandTotalYuan.toLocaleString()}元
                      </div>
                      <div className="text-sm mt-2 bg-yellow-100 p-2 rounded">
                        <div>函数返回值：{functionResult.toLocaleString()}元</div>
                        <div className={`${Math.abs(functionResult - grandTotalYuan) < 1 ? 'text-green-600' : 'text-red-600'}`}>
                          计算差异：{Math.abs(functionResult - grandTotalYuan).toLocaleString()}元
                          {Math.abs(functionResult - grandTotalYuan) < 1 ? ' ✓ 一致' : ' ✗ 不一致'}
                        </div>
                      </div>
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
