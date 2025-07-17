import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { useToast } from '../hooks/use-toast'
import blink from '../blink/client'
import { 
  Shield, 
  Store, 
  Package, 
  Users, 
  BarChart3,
  ArrowRight,
  Plus,
  Settings,
  Eye,
  EyeOff,
  Trash2,
  Search,
  Image,
  Upload
} from 'lucide-react'

interface Store {
  id: string
  merchant_id: string
  store_id: string
  store_name: string
  city: string
  district: string
  phone: string
  currency: string
  is_active: boolean
  created_at: string
}

interface Category {
  id: string
  store_id: string
  name: string
  is_visible: boolean
  sort_order: number
}

interface Product {
  id: string
  category_id: string
  store_id: string
  name: string
  price: number
  image_url?: string
  is_visible: boolean
  sort_order: number
}

interface ImageLibraryItem {
  id: string
  name: string
  category: string
  image_url: string
  is_active: boolean
}

export default function MyAdminPanel() {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [stores, setStores] = useState<Store[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [imageLibrary, setImageLibrary] = useState<ImageLibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  
  // Dialog states
  const [showAddImage, setShowAddImage] = useState(false)
  const [newImage, setNewImage] = useState({
    name: '',
    category: '',
    image_url: ''
  })

  const loadAdminData = useCallback(async () => {
    try {
      setLoading(true)

      // Load all stores
      const storesResult = await blink.db.stores.list({
        orderBy: { created_at: 'desc' }
      })
      setStores(storesResult)

      // Load all categories
      const categoriesResult = await blink.db.categories.list({
        orderBy: { created_at: 'desc' }
      })
      setCategories(categoriesResult)

      // Load all products
      const productsResult = await blink.db.products.list({
        orderBy: { created_at: 'desc' }
      })
      setProducts(productsResult)

      // Load image library
      const imagesResult = await blink.db.images_library.list({
        orderBy: { category: 'asc' }
      })
      setImageLibrary(imagesResult)

    } catch (error) {
      console.error('Error loading admin data:', error)
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل بيانات لوحة التحكم",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadAdminData()
  }, [loadAdminData])

  const toggleStoreStatus = async (storeId: string, currentStatus: boolean) => {
    try {
      await blink.db.stores.update(storeId, { 
        is_active: !currentStatus 
      })

      setStores(stores.map(store => 
        store.id === storeId ? { ...store, is_active: !currentStatus } : store
      ))
      
      toast({
        title: "تم تحديث حالة المتجر",
        description: `تم ${!currentStatus ? 'تفعيل' : 'إلغاء تفعيل'} المتجر`
      })
    } catch (error) {
      console.error('Error toggling store status:', error)
      toast({
        title: "خطأ في تحديث المتجر",
        description: "حدث خطأ أثناء تحديث حالة المتجر",
        variant: "destructive"
      })
    }
  }

  const deleteStore = async (storeId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المتجر؟ سيتم حذف جميع البيانات المرتبطة به.')) {
      return
    }

    try {
      const store = stores.find(s => s.id === storeId)
      if (!store) return

      // Delete related products first
      const storeProducts = products.filter(p => p.store_id === store.store_id)
      for (const product of storeProducts) {
        await blink.db.products.delete(product.id)
      }

      // Delete related categories
      const storeCategories = categories.filter(c => c.store_id === store.store_id)
      for (const category of storeCategories) {
        await blink.db.categories.delete(category.id)
      }

      // Delete the store
      await blink.db.stores.delete(storeId)

      setStores(stores.filter(s => s.id !== storeId))
      setCategories(categories.filter(c => c.store_id !== store.store_id))
      setProducts(products.filter(p => p.store_id !== store.store_id))
      
      toast({
        title: "تم حذف المتجر",
        description: "تم حذف المتجر وجميع البيانات المرتبطة به"
      })
    } catch (error) {
      console.error('Error deleting store:', error)
      toast({
        title: "خطأ في حذف المتجر",
        description: "حدث خطأ أثناء حذف المتجر",
        variant: "destructive"
      })
    }
  }

  const handleAddImage = async () => {
    if (!newImage.name.trim() || !newImage.category.trim() || !newImage.image_url.trim()) return

    try {
      const newImageData = await blink.db.images_library.create({
        name: newImage.name.trim(),
        category: newImage.category.trim(),
        image_url: newImage.image_url.trim(),
        is_active: true
      })

      setImageLibrary([...imageLibrary, newImageData])
      setNewImage({ name: '', category: '', image_url: '' })
      setShowAddImage(false)
      
      toast({
        title: "تم إضافة الصورة بنجاح",
        description: `تم إضافة صورة "${newImage.name}" إلى المكتبة`
      })
    } catch (error) {
      console.error('Error adding image:', error)
      toast({
        title: "خطأ في إضافة الصورة",
        description: "حدث خطأ أثناء إضافة الصورة",
        variant: "destructive"
      })
    }
  }

  const toggleImageStatus = async (imageId: string, currentStatus: boolean) => {
    try {
      await blink.db.images_library.update(imageId, { 
        is_active: !currentStatus 
      })

      setImageLibrary(imageLibrary.map(img => 
        img.id === imageId ? { ...img, is_active: !currentStatus } : img
      ))
      
      toast({
        title: "تم تحديث حالة الصورة",
        description: `تم ${!currentStatus ? 'تفعيل' : 'إلغاء تفعيل'} الصورة`
      })
    } catch (error) {
      console.error('Error toggling image status:', error)
      toast({
        title: "خطأ في تحديث الصورة",
        description: "حدث خطأ أثناء تحديث حالة الصورة",
        variant: "destructive"
      })
    }
  }

  const filteredStores = searchQuery
    ? stores.filter(store => 
        store.store_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.store_id.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : stores

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    )
  }

  const stats = {
    totalStores: stores.length,
    activeStores: stores.filter(s => s.is_active).length,
    totalCategories: categories.length,
    totalProducts: products.length,
    totalImages: imageLibrary.length,
    activeImages: imageLibrary.filter(img => img.is_active).length
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                الصفحة الرئيسية
              </Button>
              <div className="flex items-center gap-3">
                <div className="bg-primary rounded-lg p-2">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">لوحة التحكم الخاصة بي</h1>
                  <p className="text-sm text-muted-foreground">
                    رقم لوحة التحكم: ADMIN001
                  </p>
                </div>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-800">
              مدير النظام
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="stores">المتاجر</TabsTrigger>
            <TabsTrigger value="categories">الفئات</TabsTrigger>
            <TabsTrigger value="products">المنتجات</TabsTrigger>
            <TabsTrigger value="images">مكتبة الصور</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي المتاجر</CardTitle>
                  <Store className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalStores}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeStores} نشط
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي الفئات</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCategories}</div>
                  <p className="text-xs text-muted-foreground">
                    في جميع المتاجر
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي المنتجات</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalProducts}</div>
                  <p className="text-xs text-muted-foreground">
                    في جميع المتاجر
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">مكتبة الصور</CardTitle>
                  <Image className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalImages}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeImages} نشطة
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">معدل النشاط</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalStores > 0 ? Math.round((stats.activeStores / stats.totalStores) * 100) : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    من المتاجر نشطة
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>النشاط الأخير</CardTitle>
                <CardDescription>
                  آخر المتاجر المسجلة في النظام
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stores.slice(0, 5).map((store) => (
                    <div key={store.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 rounded-lg p-2">
                          <Store className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{store.store_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {store.city} - {store.district} • {store.store_id}
                          </p>
                        </div>
                      </div>
                      <Badge variant={store.is_active ? "default" : "secondary"}>
                        {store.is_active ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stores Tab */}
          <TabsContent value="stores" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">إدارة المتاجر</h2>
                <p className="text-muted-foreground">عرض وإدارة جميع المتاجر في النظام</p>
              </div>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في المتاجر..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 w-64"
                />
              </div>
            </div>

            <div className="grid gap-4">
              {filteredStores.map((store) => (
                <Card key={store.id}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 rounded-lg p-3">
                        <Store className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{store.store_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {store.city} - {store.district} • {store.phone}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          رقم المتجر: {store.store_id} • التاجر: {store.merchant_id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={store.is_active ? "default" : "secondary"}>
                        {store.is_active ? 'نشط' : 'غير نشط'}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => navigate(`/store/${store.store_id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => toggleStoreStatus(store.id, store.is_active)}
                      >
                        {store.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteStore(store.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">جميع الفئات</h2>
              <p className="text-muted-foreground">عرض جميع الفئات في النظام</p>
            </div>

            <div className="grid gap-4">
              {categories.map((category) => {
                const store = stores.find(s => s.store_id === category.store_id)
                return (
                  <Card key={category.id}>
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="flex items-center gap-4">
                        <div className="bg-secondary/10 rounded-lg p-3">
                          <Package className="h-5 w-5 text-secondary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{category.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            المتجر: {store?.store_name || 'غير معروف'}
                          </p>
                        </div>
                      </div>
                      <Badge variant={category.is_visible ? "default" : "secondary"}>
                        {category.is_visible ? 'ظاهرة' : 'مخفية'}
                      </Badge>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">جميع المنتجات</h2>
              <p className="text-muted-foreground">عرض جميع المنتجات في النظام</p>
            </div>

            <div className="grid gap-4">
              {products.map((product) => {
                const store = stores.find(s => s.store_id === product.store_id)
                const category = categories.find(c => c.id === product.category_id)
                return (
                  <Card key={product.id}>
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="flex items-center gap-4">
                        <div className="bg-accent/10 rounded-lg p-3">
                          {product.image_url ? (
                            <img 
                              src={product.image_url} 
                              alt={product.name}
                              className="w-8 h-8 object-cover rounded"
                            />
                          ) : (
                            <Package className="h-5 w-5 text-accent" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {product.price} {store?.currency} • {category?.name || 'غير محدد'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            المتجر: {store?.store_name || 'غير معروف'}
                          </p>
                        </div>
                      </div>
                      <Badge variant={product.is_visible ? "default" : "secondary"}>
                        {product.is_visible ? 'ظاهر' : 'مخفي'}
                      </Badge>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">مكتبة الصور</h2>
                <p className="text-muted-foreground">إدارة الصور المشتركة للمتاجر</p>
              </div>
              <Dialog open={showAddImage} onOpenChange={setShowAddImage}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    إضافة صورة جديدة
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>إضافة صورة جديدة</DialogTitle>
                    <DialogDescription>
                      أضف صورة جديدة إلى المكتبة المشتركة
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">اسم الصورة</label>
                      <Input
                        placeholder="مثال: حليب أطلس"
                        value={newImage.name}
                        onChange={(e) => setNewImage({ ...newImage, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">الفئة</label>
                      <Input
                        placeholder="مثال: منتجات الألبان"
                        value={newImage.category}
                        onChange={(e) => setNewImage({ ...newImage, category: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">رابط الصورة</label>
                      <Input
                        placeholder="https://example.com/image.jpg"
                        value={newImage.image_url}
                        onChange={(e) => setNewImage({ ...newImage, image_url: e.target.value })}
                      />
                      {newImage.image_url && (
                        <div className="mt-2">
                          <img 
                            src={newImage.image_url} 
                            alt="معاينة" 
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleAddImage} 
                        disabled={!newImage.name.trim() || !newImage.category.trim() || !newImage.image_url.trim()}
                      >
                        إضافة الصورة
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddImage(false)}>
                        إلغاء
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {imageLibrary.map((image) => (
                <Card key={image.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="aspect-square bg-muted">
                      <img
                        src={image.image_url}
                        alt={image.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold mb-1">{image.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{image.category}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant={image.is_active ? "default" : "secondary"}>
                          {image.is_active ? 'نشطة' : 'غير نشطة'}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleImageStatus(image.id, image.is_active)}
                        >
                          {image.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}