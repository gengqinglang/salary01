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
    const retirementSalary = Number(d.expectedRetirementSalary) || 0;
    if (retirementSalary > 0) {
      const retirementYears = 85 - d.retirementAge + 1; // 从退休年龄到85岁（包含退休当年）
      const annualRetirementIncome = retirementSalary * 12; // 月薪转年薪（元）
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
          
          {/* 调试模块：显示与Header区域一致的数据源 */}
          <div className="mt-4 mx-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-sm font-bold text-gray-800 mb-3">🔍 本人工资收入计算过程（调试用）</h3>
            <div className="space-y-3 text-xs text-gray-700">
              
              {/* Header数据源对比 */}
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <div className="font-semibold mb-2 text-green-800">Header区域使用的数据源：</div>
                {(() => {
                  // 使用与Header完全相同的逻辑
                  const headerPersonalIncome = personalTotalIncome > 0 ? personalTotalIncome : (personalFormProgressiveIncome || personalProgressiveIncome);
                  const isUsingTotalIncome = personalTotalIncome > 0;
                  const isUsingFormProgressive = !isUsingTotalIncome && personalFormProgressiveIncome > 0;
                  const isUsingContextProgressive = !isUsingTotalIncome && !isUsingFormProgressive && personalProgressiveIncome > 0;
                  
                  return (
                    <div className="text-green-800">
                      <div>personalTotalIncome: {personalTotalIncome}万元</div>
                      <div>personalFormProgressiveIncome: {personalFormProgressiveIncome / 10000}万元</div>
                      <div>personalProgressiveIncome: {personalProgressiveIncome}万元</div>
                      <div className="font-bold border-t pt-2 mt-2">
                        Header显示值: {formatToWan(headerPersonalIncome)}万元
                      </div>
                      <div className="text-sm">
                        数据来源: {
                          isUsingTotalIncome ? 'personalTotalIncome (Context完整计算)' :
                          isUsingFormProgressive ? 'personalFormProgressiveIncome (本地表单计算)' :
                          isUsingContextProgressive ? 'personalProgressiveIncome (Context预估计算)' :
                          '无数据'
                        }
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* 本地计算函数对比 */}
              <div className="bg-blue-50 p-3 rounded border border-blue-200">
                <div className="font-semibold mb-2 text-blue-800">本地计算函数结果：</div>
                {(() => {
                  const localResult = computeProgressiveIncomeFromForm(personalData);
                  const localResultWan = localResult / 10000;
                  const headerPersonalIncome = personalTotalIncome > 0 ? personalTotalIncome : (personalFormProgressiveIncome || personalProgressiveIncome);
                  const headerPersonalIncomeWan = headerPersonalIncome;
                  const formProgressiveWan = personalFormProgressiveIncome / 10000;
                  
                  return (
                    <div className="text-blue-800">
                      <div>本地函数计算: {localResultWan.toFixed(1)}万元</div>
                      <div>Header显示值: {headerPersonalIncomeWan.toFixed(1)}万元</div>
                      <div>表单保存值: {formProgressiveWan.toFixed(1)}万元</div>
                      <div className="font-bold border-t pt-2 mt-2">
                        差异分析: 
                      </div>
                      <div className="text-sm">
                        本地计算 vs Header: {Math.abs(localResultWan - headerPersonalIncomeWan).toFixed(1)}万元
                      </div>
                      <div className="text-sm">
                        本地计算 vs 表单保存: {Math.abs(localResultWan - formProgressiveWan).toFixed(1)}万元
                      </div>
                    </div>
                  );
                })()}
              </div>

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
                <div>保存状态：{personalSaved ? '已保存' : '未保存'}</div>
              </div>

              {/* 详细计算过程 */}
              <div className="bg-white p-3 rounded border">
                <div className="font-semibold mb-2">详细计算过程：</div>
                {(() => {
                  const localResult = computeProgressiveIncomeFromForm(personalData);
                  const localResultWan = localResult / 10000;
                  
                  return (
                    <div>
                      <div className="font-bold text-blue-600">本地函数最终结果：{localResultWan.toFixed(1)}万元 = {localResult.toLocaleString()}元</div>
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
