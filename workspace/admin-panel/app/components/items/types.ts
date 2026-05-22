export interface Item {
  id: number
  name: string
  description: string | null
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  slots: number
  asset_url: string | null
  active: boolean
  created_at?: string
  updated_at?: string
}
