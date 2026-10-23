import { useMemo, useState } from 'react';
import { Layout } from './components/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { CommercesPage } from './pages/CommercesPage';
import { ProductsPage } from './pages/ProductsPage';
import { PromotionsPage } from './pages/PromotionsPage';
import { DriversPage } from './pages/DriversPage';
import { OrdersPage } from './pages/OrdersPage';
import { initialCommerces, initialProducts, initialPromotions, initialDrivers, initialOrders } from './services/mockData';
import type { AppTab, Commerce, Product, Promocion, Repartidor, Order } from './types';

function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [commerces, setCommerces] = useState<Commerce[]>(initialCommerces);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [promotions, setPromotions] = useState<Promocion[]>(initialPromotions);
  const [drivers, setDrivers] = useState<Repartidor[]>(initialDrivers);
  const [orders, setOrders] = useState<Order[]>(initialOrders);

  const totalSales = useMemo(() => orders.reduce((sum, order) => sum + order.total, 0), [orders]);
  const activeOrders = useMemo(() => orders.filter((order) => order.status !== 'Entregado').length, [orders]);
  const activeCommerces = useMemo(() => commerces.filter((commerce) => commerce.status === 'Activo').length, [commerces]);
  const availableDrivers = useMemo(() => drivers.filter((driver) => driver.status === 'Disponible').length, [drivers]);

  const page = (() => {
    switch (activeTab) {
      case 'comercios':
        return <CommercesPage commerces={commerces} onChangeCommerces={setCommerces} />;
      case 'productos':
        return <ProductsPage products={products} commerces={commerces} onChangeProducts={setProducts} />;
      case 'promociones':
        return <PromotionsPage promotions={promotions} onChangePromotions={setPromotions} />;
      case 'repartidores':
        return <DriversPage drivers={drivers} onChangeDrivers={setDrivers} />;
      case 'pedidos':
        return <OrdersPage orders={orders} onChangeOrders={setOrders} />;
      default:
        return (
          <DashboardPage
            totalSales={totalSales}
            activeOrders={activeOrders}
            activeCommerces={activeCommerces}
            availableDrivers={availableDrivers}
            recentOrders={orders}
          />
        );
    }
  })();

  return (
    <Layout activeTab={activeTab} onChangeTab={setActiveTab}>
      {page}
    </Layout>
  );
}

export default App;
