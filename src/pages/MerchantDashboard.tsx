import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { useToast } from '../hooks/use-toast'
import blink from '../blink/client'
import { 
  Store, 
  Package, 
  FolderOpen, 
  Settings, 
  Eye, 
  EyeOff, 
  Plus,
  ArrowRight,
  BarChart3,
  Image,
  Edit,
  Trash2,
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
}

interface Category {
  id: string
  store_id: string
  name: string
  is_visible: boolean
  sort_order: number
  products_count?: number
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
  category_name?: string
}

interface ImageLibraryItem {
  id: string
  name: string
  category: string
  image_url: string
}

export default function MerchantDashboard() {
  const { merchantId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [activeTab, setActiveTab] = useState('overview')
  const [storeData, setStoreData] = useState<Store | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [imageLibrary, setImageLibrary] = useState<ImageLibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  
  // Dialog states
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showImageLibrary, setShowImageLibrary] = useState(false)
  
  // Form states
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newProduct, setNewProduct] = useState({
    name: '',
    category_id: '',
    price: '',
    image_url: ''
  })

  const loadStoreData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Load store data
      const storeResult = await blink.db.stores.list({
        where: { merchant_id: merchantId },
        limit: 1
      })

      if (storeResult.length === 0) {
        toast({
          title: "متجر غير موجود",
          description: "لم يتم العثور على متجر بهذا الرقم",
          variant: "destructive"
        })
        return
      }

      const store = storeResult[0]
      setStoreData(store)

      // Load categories with product count - استخدام store_id الصحيح
      const categoriesResult = await blink.db.categories.list({
        where: { store_id: store.store_id },
        orderBy: { sort_order: 'asc' }
      })

      // Count products for each category
      const categoriesWithCount = await Promise.all(
        categoriesResult.map(async (category) => {
          const productCount = await blink.db.products.list({
            where: { category_id: category.id }
          })
          return {
            ...category,
            products_count: productCount.length
          }
        })
      )
      
      setCategories(categoriesWithCount)

      // Load products
      const productsResult = await blink.db.products.list({
        where: { store_id: store.store_id },
        orderBy: { sort_order: 'asc' }
      })

      // Add category names to products
      const productsWithCategory = productsResult.map(product => {
        const category = categoriesResult.find(cat => cat.id === product.category_id)
        return {
          ...product,
          category_name: category?.name || 'غير محدد'
        }
      })
      
      setProducts(productsWithCategory)

      // Load image library
      const imagesResult = await blink.db.images_library.list({
        where: { is_active: true },
        orderBy: { category: 'asc' }
      })
      
      setImageLibrary(imagesResult)

    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل بيانات المتجر",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [merchantId, toast])

  useEffect(() => {
    if (merchantId) {
      loadStoreData()
    }
  }, [merchantId, loadStoreData])

  const handleAddCategory = async () => {
    if (!newCategoryName.trim() || !storeData) return

    try {
      const newCategory = await blink.db.categories.create({
        store_id: storeData.store_id,
        name: newCategoryName.trim(),
        sort_order: categories.length,
        is_visible: true
      })

      setCategories([...categories, { ...newCategory, products_count: 0 }])
      setNewCategoryName('')
      setShowAddCategory(false)
      
      toast({
        title: "تم إضافة الفئة بنجاح",
        description: `تم إضافة فئة "${newCategoryName}" إلى متجرك`
      })
    } catch (error) {
      console.error('Error adding category:', error)
      toast({
        title: "خطأ في إضافة الفئة",
        description: "حدث خطأ أثناء إضافة الفئة",
        variant: "destructive"
      })
    }
  }

  const handleAddProduct = async () => {
    if (!newProduct.name.trim() || !newProduct.category_id || !newProduct.price || !storeData) return

    try {
      const newProductData = await blink.db.products.create({
        store_id: storeData.store_id,
        category_id: newProduct.category_id,
        name: newProduct.name.trim(),
        price: parseFloat(newProduct.price),
        image_url: newProduct.image_url || null,
        sort_order: products.length,
        is_visible: true
      })

      // Find category name
      const category = categories.find(cat => cat.id === newProduct.category_id)
      const newProductWithCategory = {
        ...newProductData,
        category_name: category?.name || 'غير محدد'
      }

      setProducts([...products, newProductWithCategory])
      setNewProduct({ name: '', category_id: '', price: '', image_url: '' })
      setShowAddProduct(false)
      
      // Update category product count
      setCategories(categories.map(cat => 
        cat.id === newProduct.category_id 
          ? { ...cat, products_count: (cat.products_count || 0) + 1 }
          : cat
      ))
      
      toast({
        title: "تم إضافة المنتج بنجاح",
        description: `تم إضافة منتج "${newProduct.name}" إلى متجرك`
      })
    } catch (error) {
      console.error('Error adding product:', error)
      toast({
        title: "خطأ في إضافة المنتج",
        description: "حدث خطأ أثناء إضافة المنتج",
        variant: "destructive"
      })
    }
  }

  const toggleCategoryVisibility = async (categoryId: string, currentVisibility: boolean) => {
    try {
      await blink.db.categories.update(categoryId, { 
        is_visible: !currentVisibility 
      })

      setCategories(categories.map(cat => 
        cat.id === categoryId ? { ...cat, is_visible: !currentVisibility } : cat
      ))
      
      toast({
        title: "تم تحديث الفئة",
        description: `تم ${!currentVisibility ? 'إظهار' : 'إخفاء'} الفئة`
      })
    } catch (error) {
      console.error('Error toggling category visibility:', error)
      toast({
        title: "خطأ في تحديث الفئة",
        description: "حدث خطأ أثناء تحديث الفئة",
        variant: "destructive"
      })
    }
  }

  const toggleProductVisibility = async (productId: string, currentVisibility: boolean) => {
    try {
      await blink.db.products.update(productId, { 
        is_visible: !currentVisibility 
      })

      setProducts(products.map(product => 
        product.id === productId ? { ...product, is_visible: !currentVisibility } : product
      ))
      
      toast({
        title: "تم تحديث المنتج",
        description: `تم ${!currentVisibility ? 'إظهار' : 'إخفاء'} المنتج`
      })
    } catch (error) {
      console.error('Error toggling product visibility:', error)
      toast({
        title: "خطأ في تحديث المنتج",
        description: "حدث خطأ أثناء تحديث المنتج",
        variant: "destructive"
      })
    }
  }

  const selectImageFromLibrary = (imageUrl: string) => {
    setNewProduct({ ...newProduct, image_url: imageUrl })
    setShowImageLibrary(false)
    toast({
      title: "تم اختيار الصورة",
      description: "تم إضافة الصورة إلى المنتج"
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل بيانات المتجر...</p>
        </div>
      </div>
    )
  }

  if (!storeData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>متجر غير موجود</CardTitle>
            <CardDescription>
              لم يتم العثور على متجر بهذا الرقم
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              العودة للصفحة الرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stats = {
    totalCategories: categories.length,
    visibleCategories: categories.filter(c => c.is_visible).length,
    totalProducts: products.length,
    visibleProducts: products.filter(p => p.is_visible).length
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
                  <Store className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">{storeData.store_name}</h1>
                  <p className="text-sm text-muted-foreground">
                    {storeData.city} - {storeData.district}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={storeData.is_active ? "default" : "secondary"}>
                {storeData.is_active ? 'نشط' : 'غير نشط'}
              </Badge>
              <Button
                variant="outline"
                onClick={() => navigate(`/store/${storeData.store_id}`)}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                معاينة المتجر
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="categories">الفئات</TabsTrigger>
            <TabsTrigger value="products">المنتجات</TabsTrigger>
            <TabsTrigger value="settings">الإعدادات</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي الفئات</CardTitle>
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalCategories}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.visibleCategories} ظاهرة
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
                    {stats.visibleProducts} ظاهرة
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">رقم المتجر</CardTitle>
                  <Store className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-mono">{storeData.store_id}</div>
                  <p className="text-xs text-muted-foreground">
                    للمشاركة مع الزبائن
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">العملة</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{storeData.currency}</div>
                  <p className="text-xs text-muted-foreground">
                    {storeData.currency === 'MAD' ? 'درهم مغربي' : 
                     storeData.currency === 'XOF' ? 'فرانك مغربي' : 'ريال مغربي'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>إجراءات سريعة</CardTitle>
                <CardDescription>
                  الإجراءات الأكثر استخداماً لإدارة متجرك
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button 
                    className="h-20 flex-col gap-2"
                    onClick={() => setActiveTab('categories')}
                  >
                    <Plus className="h-5 w-5" />
                    إضافة فئة جديدة
                  </Button>
                  <Button 
                    variant="outline"
                    className="h-20 flex-col gap-2"
                    onClick={() => setActiveTab('products')}
                  >
                    <Package className="h-5 w-5" />
                    إضافة منتج جديد
                  </Button>
                  <Button 
                    variant="outline"
                    className="h-20 flex-col gap-2"
                    onClick={() => setShowImageLibrary(true)}
                  >
                    <Image className="h-5 w-5" />
                    مكتبة الصور
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">إدارة الفئات</h2>
                <p className="text-muted-foreground">أضف وعدل فئات منتجاتك</p>
              </div>
              <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    إضافة فئة جديدة
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>إضافة فئة جديدة</DialogTitle>
                    <DialogDescription>
                      أدخل اسم الفئة الجديدة التي تريد إضافتها
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="categoryName">اسم الفئة</Label>
                      <Input
                        id="categoryName"
                        placeholder="مثال: منتجات الألبان"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
                        إضافة الفئة
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddCategory(false)}>
                        إلغاء
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {categories.map((category) => (
                <Card key={category.id}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 rounded-lg p-3">
                        <FolderOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{category.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {category.products_count} منتج
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={category.is_visible ? "default" : "secondary"}>
                        {category.is_visible ? 'ظاهرة' : 'مخفية'}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => toggleCategoryVisibility(category.id, category.is_visible)}
                      >
                        {category.is_visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">إدارة المنتجات</h2>
                <p className="text-muted-foreground">أضف وعدل منتجاتك</p>
              </div>
              <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    إضافة منتج جديد
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>إضافة منتج جديد</DialogTitle>
                    <DialogDescription>
                      املأ بيانات المنتج الجديد
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="productName">اسم المنتج</Label>
                      <Input
                        id="productName"
                        placeholder="مثال: حليب أطلس 1 لتر"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="productCategory">الفئة</Label>
                      <Select 
                        value={newProduct.category_id} 
                        onValueChange={(value) => setNewProduct({ ...newProduct, category_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الفئة" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="productPrice">السعر ({storeData.currency})</Label>
                      <Input
                        id="productPrice"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>صورة المنتج</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="رابط الصورة (اختياري)"
                          value={newProduct.image_url}
                          onChange={(e) => setNewProduct({ ...newProduct, image_url: e.target.value })}
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowImageLibrary(true)}
                        >
                          <Image className="h-4 w-4" />
                        </Button>
                      </div>
                      {newProduct.image_url && (
                        <div className="mt-2">
                          <img 
                            src={newProduct.image_url} 
                            alt="معاينة" 
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={handleAddProduct} 
                        disabled={!newProduct.name.trim() || !newProduct.category_id || !newProduct.price}
                      >
                        إضافة المنتج
                      </Button>
                      <Button variant="outline" onClick={() => setShowAddProduct(false)}>
                        إلغاء
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {products.map((product) => (
                <Card key={product.id}>
                  <CardContent className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-secondary/10 rounded-lg p-3">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-8 h-8 object-cover rounded"
                          />
                        ) : (
                          <Package className="h-5 w-5 text-secondary" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {product.category_name} • {product.price} {storeData.currency}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={product.is_visible ? "default" : "secondary"}>
                        {product.is_visible ? 'ظاهر' : 'مخفي'}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => toggleProductVisibility(product.id, product.is_visible)}
                      >
                        {product.is_visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">إعدادات المتجر</h2>
              <p className="text-muted-foreground">عدل بيانات متجرك الأساسية</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>بيانات المتجر</CardTitle>
                <CardDescription>
                  يمكنك تعديل بيانات متجرك الأساسية هنا
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">اسم المتجر</label>
                    <p className="text-lg">{storeData.store_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">المدينة</label>
                    <p className="text-lg">{storeData.city}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">الحي</label>
                    <p className="text-lg">{storeData.district}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">رقم الهاتف</label>
                    <p className="text-lg">{storeData.phone}</p>
                  </div>
                </div>
                <Button className="mt-4">تعديل البيانات</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Image Library Dialog */}
      <Dialog open={showImageLibrary} onOpenChange={setShowImageLibrary}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>مكتبة الصور</DialogTitle>
            <DialogDescription>
              اختر صورة من المكتبة المشتركة لمنتجك
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {imageLibrary.map((image) => (
              <div 
                key={image.id}
                className="cursor-pointer border rounded-lg p-2 hover:bg-secondary/10 transition-colors"
                onClick={() => selectImageFromLibrary(image.image_url)}
              >
                <img 
                  src={image.image_url} 
                  alt={image.name}
                  className="w-full h-24 object-cover rounded mb-2"
                />
                <p className="text-sm font-medium">{image.name}</p>
                <p className="text-xs text-muted-foreground">{image.category}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}