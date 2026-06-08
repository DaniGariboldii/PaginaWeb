import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Seo } from '../../components/ui/Seo';

const profileSchema = z.object({
  firstName: z.string().min(2, 'Mínimo 2 caracteres'),
  lastName: z.string().min(2, 'Mínimo 2 caracteres'),
  phone: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Requerido'),
    newPassword: z.string().min(8, 'Mínimo 8 caracteres').regex(/[A-Z]/, 'Una mayúscula').regex(/[0-9]/, 'Un número'),
    confirm: z.string(),
  })
  .refine((d) => d.newPassword === d.confirm, { message: 'No coinciden', path: ['confirm'] });

const inputClass =
  'w-full border border-ink-200 rounded-xl px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition';

export const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const toast = useToast();

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: user?.firstName || '', lastName: user?.lastName || '', phone: user?.phone || '' },
  });

  const passwordForm = useForm({ resolver: zodResolver(passwordSchema) });

  const onSaveProfile = async (data) => {
    try {
      const res = await api.put('/auth/profile', data);
      setUser((u) => ({ ...u, ...res.data.data.user }));
      toast.success('Perfil actualizado');
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo actualizar el perfil');
    }
  };

  const onChangePassword = async (data) => {
    try {
      await api.put('/auth/change-password', { currentPassword: data.currentPassword, newPassword: data.newPassword });
      passwordForm.reset();
      toast.success('Contraseña actualizada');
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo cambiar la contraseña');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Seo title="Mi perfil" />
      <h1 className="text-3xl font-bold text-ink-900 mb-8">Mi perfil</h1>

      {/* Datos personales */}
      <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="bg-white border border-ink-200 rounded-2xl p-6 mb-6">
        <h2 className="font-semibold text-ink-900 mb-4">Datos personales</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Nombre</label>
            <input {...profileForm.register('firstName')} className={inputClass} />
            {profileForm.formState.errors.firstName && <p className="text-red-500 text-xs mt-1">{profileForm.formState.errors.firstName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Apellido</label>
            <input {...profileForm.register('lastName')} className={inputClass} />
            {profileForm.formState.errors.lastName && <p className="text-red-500 text-xs mt-1">{profileForm.formState.errors.lastName.message}</p>}
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Teléfono</label>
          <input {...profileForm.register('phone')} className={inputClass} placeholder="11 1234 5678" />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-ink-700 mb-1.5">Email</label>
          <input value={user?.email || ''} disabled className={`${inputClass} bg-ink-50 text-ink-400 cursor-not-allowed`} />
          <p className="text-xs text-ink-400 mt-1">El email no se puede modificar.</p>
        </div>
        <div className="mt-5">
          <Button type="submit" disabled={profileForm.formState.isSubmitting}>
            {profileForm.formState.isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>

      {/* Cambiar contraseña */}
      <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="bg-white border border-ink-200 rounded-2xl p-6">
        <h2 className="font-semibold text-ink-900 mb-4">Cambiar contraseña</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">Contraseña actual</label>
            <input type="password" autoComplete="current-password" {...passwordForm.register('currentPassword')} className={inputClass} />
            {passwordForm.formState.errors.currentPassword && <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.currentPassword.message}</p>}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Nueva contraseña</label>
              <input type="password" autoComplete="new-password" {...passwordForm.register('newPassword')} className={inputClass} />
              {passwordForm.formState.errors.newPassword && <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.newPassword.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Confirmar</label>
              <input type="password" autoComplete="new-password" {...passwordForm.register('confirm')} className={inputClass} />
              {passwordForm.formState.errors.confirm && <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.confirm.message}</p>}
            </div>
          </div>
        </div>
        <div className="mt-5">
          <Button type="submit" variant="secondary" disabled={passwordForm.formState.isSubmitting}>
            {passwordForm.formState.isSubmitting ? 'Cambiando...' : 'Cambiar contraseña'}
          </Button>
        </div>
      </form>
    </div>
  );
};
