import supabaseAdmin from '../../admin'

export async function createPlatformUser(userId: string, email: string, name?: string) {
  const supabase = supabaseAdmin()

  const { data: existingUser } = await supabase.from('users').select('id').eq('id', userId).single()

  if (existingUser) {
    return { data: existingUser, error: null }
  }

  const { data, error } = await supabase
    .from('users')
    .insert({
      id: userId,
      email,
      name: name || null,
      role: 'user',
      is_approved: false,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating platform user:', error)
  }

  return { data, error }
}
