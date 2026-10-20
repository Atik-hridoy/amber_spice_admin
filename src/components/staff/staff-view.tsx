import { ChefHat, Clock, Plus } from 'lucide-react'
import type { StaffMember } from '../../types/admin'

interface StaffViewProps {
  staff: StaffMember[]
  onUpdateStaffStatus: (staffId: string, status: 'active' | 'break' | 'off-duty') => void
}

export function StaffView({ staff, onUpdateStaffStatus }: StaffViewProps) {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-2xs">
        <div>
          <h3 className="font-serif text-base font-bold text-stone-900">
            Active Staff & Shift Roster
          </h3>
          <p className="text-xs text-stone-500">
            Kitchen cooks, station supervisors, and front of house service team.
          </p>
        </div>

        <button
          type="button"
          onClick={() => alert('Add staff member modal opened!')}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#B84A22] to-[#FBA138] px-4 py-2 text-xs font-bold text-white shadow-xs hover:brightness-105 transition cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {staff.map((member) => (
          <div
            key={member.id}
            className="flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-5 shadow-2xs"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#1A130E] to-[#2B2019] font-serif text-sm font-bold text-white shadow-xs">
                    {member.avatar}
                  </div>
                  <div>
                    <h4 className="font-sans text-sm font-bold text-stone-900">
                      {member.name}
                    </h4>
                    <p className="text-xs font-semibold text-[#B84A22]">
                      {member.role}
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    member.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : member.status === 'break'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {member.status}
                </span>
              </div>

              <div className="mt-4 space-y-2 border-t border-stone-100 pt-3 text-xs text-stone-600">
                <div className="flex items-center gap-1.5">
                  <ChefHat className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                  <span className="font-medium text-stone-800">{member.assignedSection}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-stone-400 shrink-0" />
                  <span>{member.shift}</span>
                </div>
              </div>
            </div>

            {/* Shift Status Quick Toggle */}
            <div className="mt-4 pt-3 border-t border-stone-100 flex gap-2">
              <button
                type="button"
                onClick={() => onUpdateStaffStatus(member.id, 'active')}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition cursor-pointer ${
                  member.status === 'active'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                On Duty
              </button>
              <button
                type="button"
                onClick={() => onUpdateStaffStatus(member.id, 'break')}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition cursor-pointer ${
                  member.status === 'break'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Break
              </button>
              <button
                type="button"
                onClick={() => onUpdateStaffStatus(member.id, 'off-duty')}
                className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition cursor-pointer ${
                  member.status === 'off-duty'
                    ? 'bg-stone-800 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Off
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
