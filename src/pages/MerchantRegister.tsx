import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { ArrowRight, Store, Copy, Check } from 'lucide-react'
import { useToast } from '../hooks/use-toast'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://bpjwszhktjqiirhdgksv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJwandzemhrdGpxaWlyaGRna3N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NjY5NTAsImV4cCI6MjA2ODM0Mjk1MH0.j-oKcMvXKr0avaDe5abnDHZP5GuJSBiiSV-EHPBhsVE'
)

export default function MerchantRegister() {
  const [formData, setFormData] = useState({
    storeName: '',
    city: '',
    district: '',
    phone: '',
    currency: 'MAD'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [registrationResult, setRegistrationResult] = useState<{
    merchantId: string
    storeId: string
  } | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  
  const navigate = useNavigate()
  const { toast } = useToast()

  const generateId = () => {
    return Math.random().toString(36).substr(2, 8).toUpperCase()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Generate unique IDs
      const merchantId = `M${generateId()}`
      const storeId = `S${generateId()}`

      // Save to database
      const { data, error } = await supabase
        .from('stores')
        .insert([
          {
            merchant_id: merchantId,
            store_id: storeId,
            store_name: formData.storeName,
            city: formData.city,
            district: formData.district,
            phone: formData.phone,
            currency: formData.currency
          }
        ])
        .select()

      if (error) {
        throw error
      }

      setRegistrationResult({
        merchantId,
        storeId
      })

      toast({
        title: "تم التسجيل بنجاح!",
        description: "تم إنشاء متجرك الإلكتروني بنجاح",
      })
    } catch (error) {
      console.error('Registration error:', error)
      toast({
        title: "خطأ في التسجيل",
        description: "حدث خطأ أثناء إنشاء المتجر. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
      toast({
        title: "تم النسخ!",
        description: "تم نسخ الرقم إلى الحافظة",
      })
    } catch (error) {
      toast({
        title: "خطأ في النسخ",
        description: "لم يتم نسخ الرقم. يرجى نسخه يدوياً.",
        variant: "destructive"
      })
    }
  }

  if (registrationResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="bg-green-100 rounded-full p-3 w-fit mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-700">تم التسجيل بنجاح!</CardTitle>
            <CardDescription>
              تم إنشاء متجرك الإلكتروني. احفظ الأرقام التالية:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Merchant ID */}
            <div className="bg-secondary/10 rounded-lg p-4">
              <Label className="text-sm font-medium text-secondary">رقم التاجر (للدخول إلى لوحة التحكم)</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input 
                  value={registrationResult.merchantId} 
                  readOnly 
                  className="font-mono text-center bg-white"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(registrationResult.merchantId, 'merchant')}
                >
                  {copiedField === 'merchant' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Store ID */}
            <div className="bg-primary/10 rounded-lg p-4">
              <Label className="text-sm font-medium text-primary">رقم المتجر (للمشاركة مع الزبائن)</Label>
              <div className="flex items-center gap-2 mt-2">
                <Input 
                  value={registrationResult.storeId} 
                  readOnly 
                  className="font-mono text-center bg-white"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(registrationResult.storeId, 'store')}
                >
                  {copiedField === 'store' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>مهم:</strong> احفظ هذين الرقمين في مكان آمن. ستحتاجهما للوصول إلى متجرك.
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => navigate(`/dashboard/${registrationResult.merchantId}`)}
                className="w-full bg-secondary hover:bg-secondary/90"
              >
                دخول لوحة التحكم
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/')}
                className="w-full"
              >
                العودة للصفحة الرئيسية
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowRight className="h-4 w-4" />
              العودة
            </Button>
            <div className="flex items-center gap-3">
              <div className="bg-primary rounded-lg p-2">
                <Store className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-lg font-bold">تسجيل تاجر جديد</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">إنشاء متجر إلكتروني جديد</CardTitle>
              <CardDescription className="text-center">
                املأ البيانات التالية لإنشاء متجرك الإلكتروني
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName">اسم المتجر *</Label>
                  <Input
                    id="storeName"
                    placeholder="مثال: بقالة الحي"
                    value={formData.storeName}
                    onChange={(e) => handleInputChange('storeName', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">المدينة *</Label>
                  <Input
                    id="city"
                    placeholder="مثال: الرباط"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="district">الحي *</Label>
                  <Input
                    id="district"
                    placeholder="مثال: أكدال"
                    value={formData.district}
                    onChange={(e) => handleInputChange('district', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الهاتف *</Label>
                  <Input
                    id="phone"
                    placeholder="مثال: 0612345678"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">العملة</Label>
                  <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MAD">درهم مغربي (MAD)</SelectItem>
                      <SelectItem value="XOF">فرانك مغربي (XOF)</SelectItem>
                      <SelectItem value="MRU">ريال مغربي (MRU)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                      جاري الإنشاء...
                    </>
                  ) : (
                    'إنشاء المتجر'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}