import { computeChange, formatMoney, RateData, rateHistory } from '../lib/rates';

/** 主屏「汇率」入口卡:10000 HKD ≈ X CNY + 涨跌 */
export function RatesCard({
  rate,
  error,
  today,
  onOpen,
}: {
  rate: RateData | null;
  error: boolean;
  today: string;
  onOpen: () => void;
}) {
  const change = rate ? computeChange(rate.rate, rateHistory(), today) : null;

  return (
    <button onClick={onOpen} className="block w-full ios-card p-4 text-left transition active:scale-[0.98]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[12px] text-[rgba(60,60,67,0.6)]">港币 → 人民币 · 市场中间价</p>
          <p className="mt-1 font-rounded text-[15px] font-semibold">10,000 HKD</p>
          {change && (
            <p
              className={`mt-1 text-[12px] font-medium ${
                change.delta >= 0 ? 'text-ios-green-text' : 'text-ios-red-text'
              }`}
            >
              {change.delta >= 0 ? '↑' : '↓'} {Math.abs(change.pct).toFixed(2)}% 较 {change.sinceDate}
            </p>
          )}
        </div>
        <div className="text-right">
          {rate ? (
            <>
              <p className="font-rounded text-[32px] font-bold leading-none tabular text-ios-green-text">
                {formatMoney(10000 * rate.rate, 0)}
              </p>
              <p className="mt-1 text-[12px] text-[rgba(60,60,67,0.5)]">CNY</p>
            </>
          ) : (
            <p className="text-[14px] text-[rgba(60,60,67,0.5)]">{error ? '暂不可用' : '加载中…'}</p>
          )}
        </div>
      </div>
    </button>
  );
}
