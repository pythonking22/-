import { useMemo } from 'react'
import { FOOD_PYRAMID_TIERS } from '../../data/foodPyramid'
import { INSECT_SPECIES } from '../../data/insectSpecies'
import InsectCard from './InsectCard'

const tierClasses = {
  rose: {
    frame: 'border-rose-300 bg-rose-50',
    rail: 'bg-rose-500',
    badge: 'bg-rose-500 text-white',
    group: 'border-rose-100',
    tint: 'bg-rose-100/55',
  },
  orange: {
    frame: 'border-orange-300 bg-orange-50',
    rail: 'bg-orange-500',
    badge: 'bg-orange-500 text-white',
    group: 'border-orange-100',
    tint: 'bg-orange-100/55',
  },
  amber: {
    frame: 'border-amber-300 bg-amber-50',
    rail: 'bg-amber-500',
    badge: 'bg-amber-500 text-white',
    group: 'border-amber-100',
    tint: 'bg-amber-100/60',
  },
  leaf: {
    frame: 'border-leaf-300 bg-leaf-50',
    rail: 'bg-leaf-500',
    badge: 'bg-leaf-500 text-white',
    group: 'border-leaf-100',
    tint: 'bg-leaf-100/70',
  },
}

export default function FoodPyramid({ onClose, speciesList = INSECT_SPECIES }) {
  const speciesById = useMemo(() => new Map(speciesList.map((species) => [species.id, species])), [speciesList])

  return (
    <section className="flex max-h-[95vh] min-h-0 w-[min(1240px,calc(100vw-24px))] flex-col rounded-2xl bg-white shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-ivory-200 px-4 py-2.5">
        <div>
          <h2 className="text-base font-bold leading-tight text-ink-900">곤충 도감 80종 먹이사슬 피라미드</h2>
          <p className="mt-0.5 text-xs font-medium leading-snug text-ink-700/60">
            단계가 올라갈수록 먹이망의 윗부분에 가까워지고, 아래 단계의 생물을 먹이로 삼아요.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="먹이사슬 피라미드 닫기"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ivory-100 text-lg font-bold text-ink-700 hover:bg-ivory-200"
        >
          x
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-3">
        <div className="space-y-2">
          {FOOD_PYRAMID_TIERS.map((tier, index) => {
            const classes = tierClasses[tier.color]
            const width = 68 + index * 10

            return (
              <div
                key={tier.id}
                className={`mx-auto grid w-full grid-cols-1 gap-2 rounded-xl border p-2 sm:w-[var(--tier-width)] sm:grid-cols-[110px_1fr] ${classes.frame}`}
                style={{ '--tier-width': `${width}%` }}
              >
                <div className="grid grid-cols-[6px_1fr] overflow-hidden rounded-lg bg-white/82 shadow-sm">
                  <div className={classes.rail} />
                  <div className="flex flex-col justify-center px-2 py-2">
                    <span className={`mb-1 w-fit rounded-full px-2 py-0.5 text-[10px] font-bold ${classes.badge}`}>
                      {tier.level}
                    </span>
                    <strong className="text-xs leading-tight text-ink-900">{tier.title}</strong>
                    <span className="mt-0.5 text-[10px] font-semibold text-ink-700/55">총 {tier.count}종</span>
                    <p className="mt-1 line-clamp-2 text-[10px] font-medium leading-snug text-ink-700/68">
                      {tier.feature}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {tier.groups.map((group) => (
                    <div
                      key={group.title}
                      className={`min-w-[96px] flex-1 rounded-lg border bg-white/92 p-1.5 shadow-sm ${classes.group}`}
                    >
                      <div className={`mb-1.5 w-fit rounded px-1.5 py-0.5 ${classes.tint}`}>
                        <p className="break-keep text-[10px] font-bold leading-tight text-ink-900">{group.title}</p>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {group.speciesIds.map((id) => {
                          const species = speciesById.get(id)
                          if (!species) return null
                          return (
                            <div key={id} className="w-20 shrink-0">
                              <InsectCard
                                name={species.name}
                                image={species.image}
                                rank={species.rank}
                                registered={species.registered}
                                showRankDot={false}
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
