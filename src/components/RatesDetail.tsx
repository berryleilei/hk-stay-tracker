import { useState } from 'react';
import {
  computeChange,
  convert,
  formatMoney,
  RateData,
  rateHistory,
  ZA_FX_URL,
} from '../lib/rates';
import { Card } from './primitives';

type Dir = 'hkd2cny' | 'cny2hkd';
const QUICK = [1000, 10000, 50000, 100000];

export function RatesDetail({
  rate,
  error,
  today,
  onBack,
}: {
  rate: RateData | null;
  error: boolean;
  today: string;
  onBack: () => void;
}) {
  const [dir, setDir] = useState<Dir>('hkd2cny');
  const [amount, setAmount] = useState(10000);

  const fromCcy = dir === 'hkd2cny' ? 'HKD' : 'CNY';
  const toCcy = dir === 'hkd2cny' ? 'CNY' : 'HKD';
  const change = rate ? computeChange(rate.rate, rateHistory(), today) : null;
  const result = rate ? convert(amount, rate.rate, dir) : null;

  return (
    <div className="mx-auto max-w-md pb-32 sm:max-w-lg">
      <div className="sticky top-0 z-10 flex items-center gap-1 border-b border-[rgba(60,60,67,0.12)] bg-ios-bg/80 px-3 pb-2.5 pt-12 backdrop-blur-xl">
        <button onClick={onBack} className="flex items-center text-[17px] text-ios-blue" aria-label="返回">
          <span className="text-[26px] leading-none">‹</span>返回
        </button>
        <p className="flex-1 text-center text-[17px] font-semibold">港币兑人民币</p>
        <span className="w-12" />
      </div>

      <div className="px-4 pt-4">
        {/* 主换算卡 */}
        <Card className="mb-3 p-6 text-center">
          <p className="text-[13px] text-[rgba(60,60,67,0.6)]">{fromCcy} → {toCcy} · 市场中间价</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="font-rounded text-[20px] font-semibold tabular">{formatMoney(amount, 0)}</span>
            <span className="text-[15px] text-[rgba(60,60,67,0.5)]">{fromCcy}</span>
          </div>
          <p className="my-1 text-[20px] text-[rgba(60,60,67,0.3)]">≈</p>
          {result !== null && rate ? (
            <>
              <p className="font-rounded text-[48px] font-bold leading-none tabular text-ios-green-text">
                {formatMoney(result, 2)}
              </p>
              <p className="mt-2 text-[15px] text-[rgba(60,60,67,0.5)]">{toCcy}</p>
              <div className="mt-4 flex justify-center gap-4 text-[13px] text-[rgba(60,60,67,0.6)]">
                <span>1 HKD = <b className="font-rounded">{rate.rate.toFixed(4)}</b></span>
                <span>100 CNY = <b className="font-rounded">{formatMoney(100 / rate.rate, 1)}</b> HKD</span>
              </div>
              {change && (
                <p
                  className={`mt-2 text-[13px] font-medium ${
                    change.delta >= 0 ? 'text-ios-green-text' : 'text-ios-red-text'
                  }`}
                >
                  {change.delta >= 0 ? '↑' : '↓'} {Math.abs(change.pct).toFixed(2)}%（较 {change.sinceDate}）
                </p>
              )}
            </>
          ) : (
            <p className="py-6 text-[15px] text-[rgba(60,60,67,0.5)]">
              {error ? '汇率暂时拉取不到,请检查网络后重开' : '加载中…'}
            </p>
          )}
        </Card>

        {/* 金额 + 方向 */}
        <Card className="mb-3 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[12px] text-[rgba(60,60,67,0.6)]">换算金额({fromCcy})</p>
            <button
              onClick={() => setDir(dir === 'hkd2cny' ? 'cny2hkd' : 'hkd2cny')}
              className="text-[13px] font-medium text-ios-blue"
            >
              ↔ 反向
            </button>
          </div>
          <input
            type="number"
            inputMode="numeric"
            value={amount}
            min={0}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
            className="w-full rounded-[12px] border border-[rgba(60,60,67,0.15)] bg-white px-4 py-3 font-rounded text-[18px] font-semibold tabular text-black"
          />
          <div className="mt-2.5 flex flex-wrap gap-2">
            {QUICK.map((q) => (
              <button
                key={q}
                onClick={() => setAmount(q)}
                className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition ${
                  amount === q ? 'bg-ios-blue text-white' : 'bg-[#787880]/12 text-[rgba(60,60,67,0.7)]'
                }`}
              >
                {formatMoney(q, 0)}
              </button>
            ))}
          </div>
        </Card>

        {/* 跳 ZA */}
        <a
          href={ZA_FX_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-3 flex items-center justify-between ios-card p-4"
        >
          <span className="text-[15px] font-semibold text-ios-blue">打开 ZA Bank 兑换页看实时牌价</span>
          <span className="text-[rgba(60,60,67,0.3)]">›</span>
        </a>

        <p className="px-2 text-[12px] leading-relaxed text-[rgba(60,60,67,0.45)]">
          ZA Bank App 内货币兑换采用市场中间价、0 手续费,本页数字即按市场中间价换算,贴近其实际兑换价(以
          App 内确认价为准)。数据来源 open exchange rates,
          {rate?.updatedText ? `更新于 ${rate.updatedText}。` : '约每日更新。'}
          跨境汇款(ZA Remit)另含便利费,不在此列。汇率换算不上传任何数据。
        </p>
      </div>
    </div>
  );
}
