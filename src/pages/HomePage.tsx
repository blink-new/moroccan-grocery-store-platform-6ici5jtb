import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Store, ShoppingCart, Users, Smartphone, Shield } from 'lucide-react'

export default function HomePage() {
  const [storeId, setStoreId] = useState('')
  const [merchantId, setMerchantId] = useState('')
  const [adminId, setAdminId] = useState('')
  const navigate = useNavigate()

  const handleStoreVisit = () => {
    if (storeId.trim()) {
      navigate(`/store/${storeId}`)
    }
  }

  const handleMerchantLogin = () => {
    if (merchantId.trim()) {
      navigate(`/dashboard/${merchantId}`)
    }
  }

  const handleAdminLogin = () => {
    if (adminId.trim()) {
      navigate(`/admin/${adminId}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary rounded-lg p-2">
                <Store className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">متجر البقال الإلكتروني</h1>
                <p className="text-sm text-muted-foreground">منصة المتاجر المغربية</p>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/register')}
              className="bg-primary hover:bg-primary/90"
            >
              تسجيل تاجر جديد
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              منصة رقمية لأصحاب البقالة في المغرب
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              أنشئ متجرك الإلكتروني بسهولة واعرض منتجاتك للزبائن عبر رابط خاص. 
              لوحة تحكم بسيطة وداعمة للغة العربية بالكامل.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="text-center">
              <CardHeader>
                <div className="bg-primary/10 rounded-full p-3 w-fit mx-auto mb-4">
                  <Store className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">إنشاء متجر سريع</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  سجل بياناتك واحصل على رقم متجر فوري لمشاركته مع الزبائن
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="bg-secondary/10 rounded-full p-3 w-fit mx-auto mb-4">
                  <ShoppingCart className="h-6 w-6 text-secondary" />
                </div>
                <CardTitle className="text-lg">إدارة المنتجات</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  أضف الفئات والمنتجات بسهولة مع دعم الصور ومكتبة مشتركة
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="bg-accent/10 rounded-full p-3 w-fit mx-auto mb-4">
                  <Smartphone className="h-6 w-6 text-accent" />
                </div>
                <CardTitle className="text-lg">متجاوب للهواتف</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  تصميم متجاوب يعمل بشكل مثالي على جميع الأجهزة والهواتف
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Access Tabs */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-center">الوصول للمنصة</CardTitle>
              <CardDescription className="text-center">
                اختر نوع الوصول المناسب لك
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="customer" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="customer">زبون</TabsTrigger>
                  <TabsTrigger value="merchant">تاجر</TabsTrigger>
                  <TabsTrigger value="admin">مدير</TabsTrigger>
                </TabsList>
                
                <TabsContent value="customer" className="space-y-4">
                  <div className="text-center">
                    <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">تصفح متجر</h3>
                    <p className="text-muted-foreground mb-4">
                      أدخل رقم المتجر لتصفح المنتجات والفئات
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Input
                      placeholder="أدخل رقم المتجر"
                      value={storeId}
                      onChange={(e) => setStoreId(e.target.value)}
                      className="text-center"
                    />
                    <Button 
                      onClick={handleStoreVisit}
                      className="w-full bg-primary hover:bg-primary/90"
                      disabled={!storeId.trim()}
                    >
                      زيارة المتجر
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="merchant" className="space-y-4">
                  <div className="text-center">
                    <Store className="h-12 w-12 text-secondary mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">لوحة التحكم</h3>
                    <p className="text-muted-foreground mb-4">
                      أدخل رقم التاجر للوصول إلى لوحة التحكم
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Input
                      placeholder="أدخل رقم التاجر"
                      value={merchantId}
                      onChange={(e) => setMerchantId(e.target.value)}
                      className="text-center"
                    />
                    <Button 
                      onClick={handleMerchantLogin}
                      className="w-full bg-secondary hover:bg-secondary/90"
                      disabled={!merchantId.trim()}
                    >
                      دخول لوحة التحكم
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="admin" className="space-y-4">
                  <div className="text-center">
                    <Shield className="h-12 w-12 text-accent mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">لوحة التحكم الرئيسية</h3>
                    <p className="text-muted-foreground mb-4">
                      أدخل رقم المدير للوصول إلى لوحة التحكم الرئيسية
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Input
                      placeholder="أدخل رقم المدير"
                      value={adminId}
                      onChange={(e) => setAdminId(e.target.value)}
                      className="text-center"
                    />
                    <Button 
                      onClick={handleAdminLogin}
                      className="w-full bg-accent hover:bg-accent/90"
                      disabled={!adminId.trim()}
                    >
                      دخول لوحة التحكم الرئيسية
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/50 border-t border-border/50 mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            <p>© 2024 متجر البقال الإلكتروني - منصة المتاجر المغربية</p>
            <p className="text-sm mt-2">مصمم خصيصاً للسوق المغربي</p>
          </div>
        </div>
      </footer>
    </div>
  )
}