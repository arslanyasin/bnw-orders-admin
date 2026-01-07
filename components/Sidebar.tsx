'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CreditCard,
  Package,
  Users,
  ShoppingCart,
  FolderTree,
  Building2,
  FileText,
  Truck,
} from 'lucide-react';

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const menuItems: MenuItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard size={20} />,
  },
  {
    label: 'Reward Orders',
    href: '/bank-orders',
    icon: <CreditCard size={20} />,
  },
  {
    label: 'HIP Orders',
    href: '/bip-orders',
    icon: <FileText size={20} />,
  },
  {
    label: 'Delivery Challans',
    href: '/delivery-challans',
    icon: <Truck size={20} />,
  },
  {
    label: 'Products',
    href: '/products',
    icon: <Package size={20} />,
  },
  {
    label: 'Vendors',
    href: '/vendors',
    icon: <Users size={20} />,
  },
  {
    label: 'Purchase Orders',
    href: '/purchase-orders',
    icon: <ShoppingCart size={20} />,
  },
  {
    label: 'Categories',
    href: '/categories',
    icon: <FolderTree size={20} />,
  },
  {
    label: 'Banks',
    href: '/banks',
    icon: <Building2 size={20} />,
  },
];

const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 z-40 w-64 h-screen bg-white border-r border-gray-200">
      <div className="h-full px-4 py-6 overflow-y-auto">
        {/* Logo */}
        <div className="mb-8 px-3">
          <h1 className="text-2xl font-bold text-gray-800">
            {process.env.NEXT_PUBLIC_APP_NAME || 'ADMIN PANEL'}
          </h1>
        </div>

        {/* Menu Items */}
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group ${
                isActive(item.href)
                  ? 'bg-blue-50 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className={`mr-3 ${isActive(item.href) ? 'text-gray-700' : 'text-gray-500'}`}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
