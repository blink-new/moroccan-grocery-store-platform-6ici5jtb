import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import { useToast } from '../hooks/use-toast'
import blink from '../blink/client'
import { 
  Store, 
  ArrowRight, 
  Search, 
  MapPin, 
  Phone,
  Package,
  Grid3X3,
  List
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

export default function StorePage() {
  const { storeId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [loading, setLoading] = useState(true)
  
  // State for real data
  const [storeData, setStoreData] = useState<Store | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    if (storeId) {
      loadStoreData()
    }
  }, [storeId, loadStoreData])

  const loadStoreData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Load store data
      const storeResult = await blink.db.stores.list({
        where: { store_id: storeId },
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

      // Load categories for this store - استخدام store_id الصحيح
      const categoriesResult = await blink.db.categories.list({
        where: { 
          store_id: store.store_id, // استخدام store.store_id بدلاً من storeId
          is_visible: true 
        },
        orderBy: { sort_order: 'asc' }
      })

      // Count products for each category
      const categoriesWithCount = await Promise.all(
        categoriesResult.map(async (category) => {
          const productCount = await blink.db.products.list({
            where: { 
              category_id: category.id,
              is_visible: true 
            }
          })
          return {
            ...category,
            products_count: productCount.length
          }
        })
      )

      setCategories(categoriesWithCount)

      // Load products for this store - استخدام store_id الصحيح
      const productsResult = await blink.db.products.list({
        where: { 
          store_id: store.store_id, // استخدام store.store_id بدلاً من storeId
          is_visible: true 
        },
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

    } catch (error) {
      console.error('Error loading store data:', error)
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل بيانات المتجر",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [storeId, toast])

  const visibleCategories = categories.filter(c => c.is_visible)
  const visibleProducts = products.filter(p => p.is_visible)

  const filteredProducts = selectedCategory 
    ? visibleProducts.filter(p => p.category_id === selectedCategory)
    : visibleProducts

  const searchedProducts = searchQuery
    ? filteredProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : filteredProducts

  const selectedCategoryData = selectedCategory 
    ? visibleCategories.find(c => c.id === selectedCategory)
    : null

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل المتجر...</p>
        </div>
      </div>
    )
  }

  if (!storeData || !storeData.is_active) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center p-8">
            <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">المتجر غير متاح</h2>
            <p className="text-muted-foreground mb-4">
              هذا المتجر غير نشط حالياً أو رقم المتجر غير صحيح
            </p>
            <Button onClick={() => navigate('/')}>
              العودة للصفحة الرئيسية
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-10">
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
                العودة
              </Button>
              <div className="flex items-center gap-3">
                <div className="bg-primary rounded-lg p-2">
                  <Store className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold">{storeData.store_name}</h1>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {storeData.city} - {storeData.district}
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {storeData.phone}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800">
              متجر نشط
            </Badge>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-4">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  الفئات
                </h2>
                <div className="space-y-2">
                  <Button
                    variant={selectedCategory === null ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(null)}
                  >
                    جميع المنتجات ({visibleProducts.length})
                  </Button>
                  {visibleCategories.map((category) => (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      {category.name} ({category.products_count || 0})
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products Area */}
          <div className="lg:col-span-3">
            {/* Search and View Controls */}
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث في المنتجات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Category Header */}
            {selectedCategoryData && (
              <div className="mb-6">
                <h2 className="text-2xl font-bold">{selectedCategoryData.name}</h2>
                <p className="text-muted-foreground">
                  {searchedProducts.length} منتج متاح
                </p>
              </div>
            )}

            {/* Products Grid/List */}
            {searchedProducts.length === 0 ? (
              <Card>
                <CardContent className="text-center p-12">
                  <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">لا توجد منتجات</h3>
                  <p className="text-muted-foreground">
                    {searchQuery 
                      ? 'لم يتم العثور على منتجات تطابق البحث'
                      : 'لا توجد منتجات في هذه الفئة حالياً'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className={
                viewMode === 'grid' 
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
                  : 'space-y-4'
              }>
                {searchedProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className={
                      viewMode === 'grid' ? 'p-0' : 'flex items-center gap-4 p-4'
                    }>
                      {viewMode === 'grid' ? (
                        <>
                          <div className="aspect-square bg-muted">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-12 w-12 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold mb-2 line-clamp-2">{product.name}</h3>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-primary">
                                {product.price} {storeData.currency}
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{product.name}</h3>
                            <span className="text-lg font-bold text-primary">
                              {product.price} {storeData.currency}
                            </span>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}