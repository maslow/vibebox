# Happy Client 布局系统深度探索总结

> **📌 MVP 布局策略（2025-11-10）**
>
> **当前架构：** 两栏布局（平板：侧边栏 + 主面板 / 手机：底部 Tab + 全屏内容）
>
> **设计决策：** MVP 阶段保持现有两栏布局，不实施三栏布局方案。原因：
> - ✅ 现有架构稳定可靠（基于 Drawer 导航）
> - ✅ 实现成本低，无需大规模重构
> - ✅ 符合 MVP "Simplicity > Features" 原则
>
> **导航简化：** Boxes Tab 已移除，订阅管理整合到 Settings。详见 `boxes-tab-redesign.md`

## 目录结构快速导航

### 关键布局文件位置
- **根布局**: `/Users/fugen/codes/happy/client/sources/app/_layout.tsx`
- **应用布局**: `/Users/fugen/codes/happy/client/sources/app/(app)/_layout.tsx`
- **首页**: `/Users/fugen/codes/happy/client/sources/app/(app)/index.tsx`
- **Web HTML根**: `/Users/fugen/codes/happy/client/sources/app/+html.tsx`

### 核心布局组件
- **主导航**: `/Users/fugen/codes/happy/client/sources/components/SidebarNavigator.tsx`
- **主视图**: `/Users/fugen/codes/happy/client/sources/components/MainView.tsx`
- **侧边栏**: `/Users/fugen/codes/happy/client/sources/components/SidebarView.tsx`
- **标签栏**: `/Users/fugen/codes/happy/client/sources/components/TabBar.tsx`
- **自定义头**: `/Users/fugen/codes/happy/client/sources/components/navigation/Header.tsx`
- **布局配置**: `/Users/fugen/codes/happy/client/sources/components/layout.ts`

### 样式系统
- **Unistyles配置**: `/Users/fugen/codes/happy/client/sources/unistyles.ts`
- **主题定义**: `/Users/fugen/codes/happy/client/sources/theme.ts`
- **CSS主题**: `/Users/fugen/codes/happy/client/sources/theme.css`

### 响应式工具
- **响应式Hook**: `/Users/fugen/codes/happy/client/sources/utils/responsive.ts`
- **设备计算**: `/Users/fugen/codes/happy/client/sources/utils/deviceCalculations.ts`
- **平台检测**: `/Users/fugen/codes/happy/client/sources/utils/platform.ts`

---

## 架构概览

### 布局系统核心架构

```
RootLayout (_layout.tsx)
├── FaviconPermissionIndicator (Web only, 并列渲染)
└── 提供者堆栈
    ├── PostHogProvider (可选, 分析追踪)
    ├── LogtoProvider (OAuth)
    ├── LogtoAuthProvider (Logto 认证状态)
    ├── SafeAreaProvider (安全区域)
    ├── KeyboardProvider (键盘控制)
    ├── GestureHandlerRootView (手势)
    ├── AuthProvider (Happy 认证状态管理)
    ├── HappyAutoLogin (自动登录 Happy Server)
    ├── ThemeProvider (React Navigation 主题)
    ├── StatusBarProvider (状态栏样式) ← 并列，不嵌套
    ├── ModalProvider (模态框)
    ├── CommandPaletteProvider (命令面板)
    ├── RealtimeProvider (实时通信)
    ├── HorizontalSafeAreaWrapper (水平安全区域)
    └── AuthGuard (Logto 认证守卫)
        └── SidebarNavigator
            ├── Drawer (drawer导航)
            │   ├── 永久抽屉模式 (平板, isTablet=true)
            │   │   ├── drawerType: 'permanent'
            │   │   ├── width: 动态计算 (250-360px)
            │   │   └── SidebarView (左侧导航内容)
            │   └── 隐藏抽屉模式 (手机, isTablet=false)
            │       ├── drawerType: 'front'
            │       ├── swipeEnabled: false
            │       └── 显示为0宽度
            └── StackLayout (app/)
                ├── index.tsx (首页)
                ├── 会话管理页面
                ├── 设置页面
                └── 其他页面

```

### 响应式布局策略

#### 1. 设备类型检测
```typescript
// 基于对角线英寸计算
function determineDeviceType(params: {
    diagonalInches: number;
    platform: string;
    isPad?: boolean;
    tabletThresholdInches?: number; // 默认 9 英寸
}): 'phone' | 'tablet'

// iOS: 使用 Platform.isPad，但有特殊处理
// Android: 计算对角线尺寸，>9" 认为是平板
// 平板: 250-360px 侧边栏 + 主内容
// 手机: 100% 全屏 + 底部标签栏
```

**iPad Mini 特殊处理**:
- iPad Mini 尺寸范围: 7.9-8.3 英寸
- 虽然 `Platform.isPad` 返回 true，但对角线 < 9"
- 被判定为 `'phone'` 类型，使用手机布局
- 只有 > 9" 的 iPad 才使用平板布局

**Mac Catalyst 检测**:
```typescript
// 方法 1: 通过设备类型
const isMacCatalyst = getDeviceType() === 'Desktop';

// 方法 2: 通过平台版本字符串
const isMacCatalyst = Platform.isPad && Platform.Version.includes('Mac');
```
- Mac Catalyst 应用运行在 macOS 上
- 头部高度使用桌面风格: 56px
- 最大宽度约束: 1400px (而非 800px)

#### 2. 断点配置 (Unistyles)
```typescript
const breakpoints = {
    xs: 0,      // 最小屏幕
    sm: 300,    // 小手机
    md: 500,    // 标准手机
    lg: 800,    // 平板
    xl: 1200    // 大屏幕
}
```

#### 3. 头部高度计算
```typescript
calculateHeaderHeight({
    platform: 'ios' | 'android' | 'web'
    isLandscape: boolean
    isPad?: boolean
    deviceType?: 'phone' | 'tablet'
    isMacCatalyst?: boolean
})

// 返回值:
// iOS iPhone: 44pt
// iOS iPad: 50pt
// Android Phone: 56dp (纵) / 48dp (横)
// Android Tablet: 64dp
// Web: 56px
// Mac Catalyst: 56px
```

---

## 关键组件详解

### 1. RootLayout (_layout.tsx)

**职责**: 应用初始化和提供者设置

```typescript
// 全局字体加载状态和锁
let lock = new AsyncLock();
let loaded = false;

async function loadFonts() {
    await lock.inLock(async () => {
        if (loaded) {
            return;
        }
        loaded = true;

        // 检测是否在 Tauri 环境中
        const isTauri = Platform.OS === 'web' &&
            typeof window !== 'undefined' &&
            (window as any).__TAURI_INTERNALS__ !== undefined;

        if (!isTauri) {
            // 正常字体加载（原生和常规 Web）
            await Fonts.loadAsync({
                SpaceMono: require('@/assets/fonts/SpaceMono-Regular.ttf'),
                'IBMPlexSans-Regular': require('@/assets/fonts/IBMPlexSans-Regular.ttf'),
                'IBMPlexSans-Italic': require('@/assets/fonts/IBMPlexSans-Italic.ttf'),
                'IBMPlexSans-SemiBold': require('@/assets/fonts/IBMPlexSans-SemiBold.ttf'),
                'IBMPlexMono-Regular': require('@/assets/fonts/IBMPlexMono-Regular.ttf'),
                'IBMPlexMono-Italic': require('@/assets/fonts/IBMPlexMono-Italic.ttf'),
                'IBMPlexMono-SemiBold': require('@/assets/fonts/IBMPlexMono-SemiBold.ttf'),
                'BricolageGrotesque-Bold': require('@/assets/fonts/BricolageGrotesque-Bold.ttf'),
                ...FontAwesome.font,
            });
        } else {
            // Tauri 环境：不等待字体加载，通过 CSS 加载
            console.log('Tauri 环境：跳过字体等待');
            (async () => {
                try {
                    await Fonts.loadAsync({ /* 相同的字体 */ });
                } catch (e) {
                    // 忽略错误
                }
            })();
        }
    });
}

export default function RootLayout() {
    const [initState, setInitState] = React.useState<{ credentials: AuthCredentials | null } | null>(null);

    React.useEffect(() => {
        (async () => {
            try {
                // 1. 加载字体
                await loadFonts();

                // 2. 初始化加密库 (libsodium)
                await sodium.ready;

                // 3. 获取存储的认证凭证
                const credentials = await TokenStorage.getCredentials();
                console.log('credentials', credentials);

                // 4. 恢复同步状态（如果有凭证）
                if (credentials) {
                    await syncRestore(credentials);
                }

                setInitState({ credentials });
            } catch (error) {
                console.error('Error initializing:', error);
            }
        })();
    }, []);

    React.useEffect(() => {
        if (initState) {
            setTimeout(() => {
                SplashScreen.hideAsync();
            }, 100);
        }
    }, [initState]);

    if (!initState) return null;

    // 返回完整的提供者栈和 SidebarNavigator
}

// 水平安全区域包装器
// 为平板布局添加左右 padding
function HorizontalSafeAreaWrapper({ children }) {
    const insets = useSafeAreaInsets();
    return (
        <View style={{
            flex: 1,
            paddingLeft: insets.left,
            paddingRight: insets.right
        }}>
            {children}
        </View>
    );
}
```

**初始化流程详解**:

1. **字体加载** (`loadFonts` 函数)
   - IBM Plex Sans: Regular, Italic, SemiBold
   - IBM Plex Mono: Regular, Italic, SemiBold (代码显示)
   - Bricolage Grotesque: Bold (标题显示)
   - SpaceMono: Regular (特定场景)
   - FontAwesome 图标字体
   - **AsyncLock 机制**: 使用全局锁和 `loaded` 标志防止重复加载
   - **Tauri 特殊处理**: 在 Tauri 环境中不等待字体加载完成，通过 CSS 预加载字体

2. **加密库初始化** (libsodium)
   - 等待 `sodium.ready` 完成
   - 用于端到端加密和密钥管理

3. **获取存储的认证凭证**
   - 使用 `TokenStorage.getCredentials()` 从安全存储读取凭证
   - 返回 `AuthCredentials | null`

4. **恢复同步状态** (`syncRestore`)
   - **重要**：如果有保存的凭证，调用 `syncRestore(credentials)` 恢复数据同步状态
   - 这是数据恢复的关键步骤，确保用户数据在应用重启后可用

5. **启动屏幕控制**
   - 初始化完成后延迟 100ms 隐藏启动屏幕
   - 使用 `SplashScreen.hideAsync()`

**关键特性**:
- **AsyncLock 防重复**: 全局锁确保字体只加载一次
- **双阶段状态管理**: 第一个 useEffect 初始化，第二个 useEffect 隐藏启动屏幕
- **错误处理**: try-catch 捕获初始化错误并记录日志
- **Tauri 优化**: Web 版本通过 CSS 预加载字体，无需等待
- **主题预加载**: 主题配置在 `unistyles.ts` 中预加载，不在 RootLayout 中处理

### 2. AuthGuard (认证守卫)

**职责**: Logto OAuth 认证检查和路由保护

```typescript
/**
 * Authentication Guard Component
 *
 * 双重认证架构说明:
 * - **Logto Auth**: 用于 VibeBox 平台访问（订阅、管理） - 在此组件检查
 * - **Happy Auth**: 用于开发环境访问 - 由 HappyAutoLogin 组件自动处理
 *
 * 此守卫只检查 Logto 认证状态，并渲染：
 * - 加载屏幕（检查认证状态时）
 * - 登录屏幕（未认证时）
 * - 子组件（已认证时）
 *
 * 注意：Logto 认证成功后，HappyAutoLogin 组件会自动尝试登录 Happy Server。
 * 两个认证都必须成功，用户才能访问应用。
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useLogtoAuth();
    const pathname = usePathname();

    // 允许 /callback 路由绕过认证检查（OAuth 重定向流程需要）
    if (Platform.OS === 'web' && pathname === '/callback') {
        return <>{children}</>;
    }

    // 检查认证状态时显示加载指示器
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#fff" />
            </View>
        );
    }

    // 未认证时显示登录屏幕
    if (!isAuthenticated) {
        return <LoginScreen />;
    }

    // 用户已认证，显示主应用
    return <>{children}</>;
}
```

**认证架构说明**:

**AuthGuard 只处理 Logto OAuth 认证**:
- ✅ 检查 `useLogtoAuth()` 返回的 `isAuthenticated`
- ✅ 加载中显示 ActivityIndicator
- ✅ 未认证时直接渲染 `<LoginScreen />` 组件（不使用路由重定向）
- ✅ Web 平台的 `/callback` 路由绕过检查（允许 OAuth 回调完成）

**Happy Server 认证由 HappyAutoLogin 自动处理**:
- `HappyAutoLogin` 组件在 `AuthProvider` 内部
- 在 Logto 认证成功后，自动使用 Logto token 登录 Happy Server
- 用户无需手动操作，两层认证自动完成

**提供者栈中的位置**:
```
AuthProvider (Happy 认证状态管理)
├── HappyAutoLogin (自动登录 Happy Server)
│   └── ...其他提供者
│       └── AuthGuard (检查 Logto 认证)
│           └── SidebarNavigator (主应用)
```

**特殊处理**:
- Web 平台的 `/callback` 路由绕过认证检查
- 允许 Logto SDK 处理 OAuth 重定向流程
- 不使用 `React.memo`，因为认证状态变化频繁需要重新渲染

### 3. SidebarNavigator

**职责**: 管理平板/手机的不同布局模式

```typescript
export const SidebarNavigator = React.memo(() => {
    const isTablet = useIsTablet();
    const showPermanentDrawer = auth.isAuthenticated && isTablet;
    
    // 平板模式: 永久抽屉 (永远可见)
    // 手机模式: 前置抽屉 (滑出菜单)
    
    const drawerNavigationOptions = React.useMemo(() => {
        if (!showPermanentDrawer) {
            return {
                drawerType: 'front',
                swipeEnabled: false,
                drawerStyle: { display: 'none' }
            };
        }
        
        return {
            drawerType: 'permanent',
            drawerStyle: {
                width: drawerWidth, // 250-360px
            }
        };
    }, [showPermanentDrawer, drawerWidth]);
    
    return <Drawer screenOptions={drawerNavigationOptions} />;
});

// 抽屉宽度计算
drawerWidth = Math.min(Math.max(
    Math.floor(windowWidth * 0.3), 
    250  // 最小值
), 360) // 最大值
```

**关键设计**:
- 永久/前置抽屉模式自动切换
- 抽屉宽度响应式 (30% 窗口宽度, 250-360px 范围)
- 仅在认证用户且平板时显示永久抽屉

### 4. MainView

**职责**: 处理手机/平板的不同布局变体

```typescript
interface MainViewProps {
    variant: 'phone' | 'sidebar';
}

export const MainView = React.memo(({ variant }: MainViewProps) => {
    const sessionListViewData = useVisibleSessionListViewData();
    const isTablet = useIsTablet();
    
    // 平板 phone 模式的特殊处理:
    // 当用户在平板上查看索引视图时,
    // 返回空视图 (内容在侧边栏中显示)
    if (isTablet) {
        return <View style={styles.emptyStateContentContainer} />;
    }
    
    // 手机模式: 标签栏 + 内容
    return (
        <>
            <VoiceAssistantStatusBar />
            <View style={styles.phoneContainer}>
                {renderTabContent()} {/* 根据 activeTab 渲染不同内容 */}
            </View>
            <TabBar activeTab={activeTab} onTabPress={handleTabPress} />
        </>
    );
});

// 标签内容
switch (activeTab) {
    case 'chats': return <SessionsListWrapper />;
    case 'boxes': return <BoxesView />;
    case 'me': return <MeView />;
    case 'zen': return <ZenHome />;  // 实验性功能，需 settings.experiments 启用
}
```

**关键特性**:
- 两种变体: 'phone' (底部标签栏) 和 'sidebar' (列表布局)
- 标签状态管理 (chats/boxes/me/zen)
- 空状态处理

### 5. SidebarView

**职责**: 平板侧边栏导航

```typescript
export const SidebarView = React.memo(() => {
    // 风格特点:
    // - 固定左侧位置
    // - 包含导航按钮、状态显示、徽章
    
    // 结构:
    // - 头部 (Logo + 状态指示)
    // - 列表内容 (SessionsList / BoxesView / SettingsView)
    // - 底部操作按钮
});

// 样式布局:
const styles = {
    container: {
        flex: 1,
        borderColor: theme.colors.divider,
        borderWidth: StyleSheet.hairlineWidth
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        // 高度由 useHeaderHeight() 决定
    },
    rightContainer: {
        marginLeft: 'auto',
        flexDirection: 'row'
    }
};
```

### 6. TabBar (手机底部导航)

**职责**: 手机端标签导航

```typescript
export const TabBar = React.memo(({ activeTab, onTabPress }) => {
    // Chats / Boxes / Me (/ Zen - 实验功能)
    
    const styles = StyleSheet.create((theme) => ({
        outerContainer: {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.divider
        },
        innerContainer: {
            maxWidth: layout.maxWidth,
            flexDirection: 'row',
            justifyContent: 'space-around'
        },
        tab: {
            flex: 1,
            alignItems: 'center'
        }
    }));
});

// 标签图标来自 assets/images/brutalist/
// 支持徽章显示 (未读计数)
```

**特点**:
- 使用 layout.maxWidth 约束宽度 (响应式)
- 图标 + 标签 显示
- 活跃标签粗体显示
- **Zen 标签**: 实验性功能，需要 `settings.experiments` 为 true 才显示

### 7. Header (自定义导航头)

**职责**: 跨平台自定义头部

```typescript
interface HeaderProps {
    title?: React.ReactNode;
    subtitle?: string;
    headerLeft?: (() => React.ReactNode) | null;
    headerRight?: (() => React.ReactNode) | null;
    headerStyle?: any;
    headerShadowVisible?: boolean;
    headerTransparent?: boolean;
}

export const Header = React.memo((props: HeaderProps) => {
    // 结构:
    // Left (返回按钮) | Center (标题 + 副标题) | Right (操作按钮)
    
    const insets = useSafeAreaInsets();
    const headerHeight = useHeaderHeight();
    
    return (
        <View style={[containerStyle, { paddingTop: insets.top }]}>
            <View style={[styles.content, { height: headerHeight }]}>
                <View style={styles.leftContainer}>
                    {headerLeft && headerLeft()}
                </View>
                <View style={styles.centerContainer}>
                    {title}
                </View>
                <View style={styles.rightContainer}>
                    {headerRight && headerRight()}
                </View>
            </View>
        </View>
    );
});

// 返回按钮处理:
// - iOS: 使用 chevron-back
// - Android: 使用 arrow-back
// - 平板: 在第1-2层时隐藏返回按钮
```

**响应式行为**:
- 头部高度基于平台、设备类型、方向
- iOS 居中标题,Android 左对齐
- 安全区域顶部 padding

### 8. Layout 配置

**职责**: 全局布局约束

```typescript
// /components/layout.ts
import { Dimensions, Platform } from 'react-native';
import { getDeviceType } from '@/utils/responsive';
import { isRunningOnMac } from '@/utils/platform';

// 计算最大宽度（用于 header）
function getMaxWidth(): number {
    const deviceType = getDeviceType();

    // 手机：使用窗口的最大尺寸（宽或高）
    if (deviceType === 'phone' && Platform.OS !== 'web') {
        const { width, height } = Dimensions.get('window');
        return Math.max(width, height);
    }

    // Mac Catalyst: 无限制
    if (isRunningOnMac()) {
        return Number.POSITIVE_INFINITY;
    }

    // 平板和 Web: 800px
    return 800;
}

// 计算布局最大宽度（用于内容）
function getMaxLayoutWidth(): number {
    const deviceType = getDeviceType();

    // 手机：使用窗口的最大尺寸（宽或高）
    if (deviceType === 'phone' && Platform.OS !== 'web') {
        const { width, height } = Dimensions.get('window');
        return Math.max(width, height);
    }

    // Mac Catalyst: 1400px
    if (isRunningOnMac()) {
        return 1400;
    }

    // 平板和 Web: 800px
    return 800;
}

export const layout = {
    maxWidth: getMaxLayoutWidth(),     // 内容最大宽度
    headerMaxWidth: getMaxWidth()      // 头部最大宽度
}

// 使用场景:
// <View style={{ maxWidth: layout.maxWidth }} />  // 内容容器
// <TabBar style={{ maxWidth: layout.maxWidth }} /> // 底部标签栏
// <Header maxWidth={layout.headerMaxWidth} />      // 头部
```

**设计原则**:

| 平台/设备 | `layout.maxWidth` (内容) | `layout.headerMaxWidth` (头部) |
|-----------|-------------------------|-------------------------------|
| 手机 (iOS/Android) | 无限制 (窗口最大尺寸) | 无限制 (窗口最大尺寸) |
| 平板 | 800px | 800px |
| Web (非 Mac) | 800px | 800px |
| Mac Catalyst | 1400px | **无限制** (Number.POSITIVE_INFINITY) |

**关键区别**:
- **Mac Catalyst 的头部**: 使用无限制宽度，适应桌面窗口
- **Mac Catalyst 的内容**: 限制到 1400px，保持可读性
- **手机**: 最大化使用可用宽度（支持横屏时使用较大值）
- **平板/Web**: 统一使用 800px 约束

---

## 响应式设计系统

### 1. 响应式 Hook 库

```typescript
// responsive.ts 中的关键 Hook

// 获取设备类型
export function useDeviceType(): 'phone' | 'tablet' {
    const { width, height } = useWindowDimensions();
    
    // 使用对角线英寸计算
    // 计算方式: 英寸 = 点数 / DPI
    // iOS: 163 DPI, Android: 160 DPI
    // >9" 认为是平板
}

// 检测平板
export function useIsTablet(): boolean {
    const deviceType = useDeviceType();
    return deviceType === 'tablet';
}

// 检测横屏
export function useIsLandscape(): boolean {
    const { width, height } = useWindowDimensions();
    return width > height;
}

// 获取头部高度
export function useHeaderHeight(): number {
    // 返回基于平台、设备、方向的头部高度
}
```

### 2. Unistyles 主题系统

```typescript
// unistyles.ts 配置

const breakpoints = {
    xs: 0,    // 默认 (必须包含)
    sm: 300,  // 小手机
    md: 500,  // 标准手机
    lg: 800,  // 平板
    xl: 1200  // 大屏幕
};

const appThemes = {
    light: lightTheme,
    dark: darkTheme
};

// 配置自适应主题
const settings = {
    adaptiveThemes: true,      // 跟随系统深浅色
    CSSVars: true,             // 启用 CSS 变量 (Web)
    initialTheme: 'light'      // 默认主题
};

StyleSheet.configure({
    settings,
    breakpoints,
    themes: appThemes
});
```

### 3. 主题颜色系统

```typescript
// 两个主题: lightTheme 和 darkTheme

// 主要颜色
colors: {
    text: '#000000' / '#ffffff',
    textSecondary: '#8E8E93',
    surface: '#ffffff' / '#18171C',
    groupped: {
        background: '#F2F2F7' (iOS) / '#F5F5F5' (Android)
    },
    header: {
        background: '#ffffff' / '#18171C',
        tint: '#18171C' / '#ffffff'
    }
}

// 平台特定颜色:
textDestructive: iOS '#FF3B30' / Android '#F44336'
switch.track.active: iOS '#34C759' / Android '#1976D2'
```

### 4. 样式创建模式

```typescript
// 所有样式使用 Unistyles StyleSheet.create

const styles = StyleSheet.create((theme, runtime) => ({
    container: {
        flex: 1,
        backgroundColor: theme.colors.groupped.background,
        paddingTop: runtime.insets.top, // 安全区域
        paddingHorizontal: theme.margins.md
    },
    text: {
        color: theme.colors.text,
        ...Typography.default('semiBold')
    }
}));

// 使用:
const { styles, theme } = useStyles(styles);
<View style={styles.container}>
    <Text style={styles.text}>Content</Text>
</View>
```

---

## 导航系统

### 1. Expo Router 文件结构

```
app/
├── _layout.tsx              # 根布局 (提供者栈)
├── +html.tsx                # Web HTML 根
├── callback.tsx             # OAuth 回调
├── (auth)/                  # 认证组 (未认证时显示)
│   ├── login.tsx
│   └── _layout.tsx
└── (app)/                   # 应用组 (认证后显示)
    ├── _layout.tsx          # 使用 Stack 导航
    ├── index.tsx            # 首页 (/chats 等价)
    ├── session/
    │   ├── [id].tsx         # 会话详情
    │   ├── [id]/info.tsx
    │   ├── [id]/files.tsx
    │   └── recent.tsx
    ├── settings/
    │   ├── index.tsx
    │   ├── account.tsx
    │   ├── appearance.tsx
    │   └── connect/
    ├── zen/
    ├── boxes/
    └── ... 其他页面
```

### 2. 路由配置 ((app)/_layout.tsx)

```typescript
export const unstable_settings = {
    initialRouteName: 'index'  // 默认页面
};

export default function RootLayout() {
    return (
        <Stack
            initialRouteName='index'
            screenOptions={{
                header: shouldUseCustomHeader ? createHeader : undefined,
                headerBackTitle: t('common.back'),
                headerShadowVisible: false,
                contentStyle: {
                    backgroundColor: theme.colors.surface
                },
                headerStyle: {
                    backgroundColor: theme.colors.header.background
                }
            }}
        >
            {/* 为每个页面配置导航选项 */}
        </Stack>
    );
}

// 屏幕配置示例:
<Stack.Screen
    name="session/[id]"
    options={{
        headerShown: false  // 自定义头部
    }}
/>

<Stack.Screen
    name="settings/index"
    options={{
        headerShown: true,
        headerTitle: t('settings.title')
    }}
/>
```

### 3. 自定义头部创建

```typescript
// createHeader 函数
export const createHeader = (props: NativeStackHeaderProps) => {
    if (props.options.headerShown === false) {
        return null;
    }
    return <NavigationHeaderComponent {...props} />;
};

// 处理:
// - 平板时隐藏返回按钮 (在第1-2层)
// - 平台特定的返回图标 (iOS chevron / Android arrow)
// - 标题文本对齐 (iOS 中心 / Android 左对齐)
```

### 4. 页面展示规则

```typescript
// 自定义头部用于:
const shouldUseCustomHeader = 
    Platform.OS === 'android' || 
    isRunningOnMac() || 
    Platform.OS === 'web';

// iOS (非 Catalyst) 使用原生头部
// Android, Web, Mac Catalyst 使用自定义头部
```

---

## 布局模式详解

### 手机布局 (Phone Layout)

```
┌─────────────────────────────────┐
│      StatusBar (系统)             │
├─────────────────────────────────┤
│          Header                  │
│    (自定义或原生)                  │
├─────────────────────────────────┤
│                                 │
│      Main Content               │
│      (根据当前路由显示)           │
│                                 │
│                                 │
├─────────────────────────────────┤
│    TabBar (Chats/Boxes/Me)      │
│    底部安全区域 padding           │
└─────────────────────────────────┘
```

**特点**:
- 全屏内容
- 底部标签栏导航
- 顶部自定义或原生头部
- 安全区域处理 (notch, home indicator)

### 平板布局 (Tablet Layout)

```
┌──────┬─────────────────────────────┐
│      │     StatusBar (系统)          │
│      ├─────────────────────────────┤
│      │       Header                │
│ Side │   (自定义或原生)              │
│ bar  ├─────────────────────────────┤
│ View │                             │
│      │      Main Content Panel     │
│      │    (根据选择显示)             │
│  280 │                             │
│ -360 │                             │
│  px  │                             │
│      │                             │
│      │                             │
└──────┴─────────────────────────────┘
```

**特点**:
- 左侧永久抽屉 (250-360px)
- 右侧主内容 (flex: 1)
- 顶部共享头部
- 不显示底部标签栏

### Web 布局 (MVP: 与平板布局相同)

> **注：** 三列布局方案已废弃（实现成本过高，不适合 MVP）。
> MVP 阶段 Web 使用与平板相同的两栏布局。

**当前 Web 布局（≥ 700px）：**
```
┌──────┬─────────────────────────────┐
│      │     StatusBar (系统)          │
│      ├─────────────────────────────┤
│      │       Header                │
│ Side │   (自定义或原生)              │
│ bar  ├─────────────────────────────┤
│ View │                             │
│      │      Main Content Panel     │
│      │    (根据选择显示)             │
│  280 │                             │
│ -360 │                             │
│  px  │                             │
│      │                             │
│      │                             │
└──────┴─────────────────────────────┘
```

**布局特点：**
- 左侧永久侧边栏（250-360px）
- 右侧主内容区（flex: 1）
- 与平板体验一致

---

## 首页实现示例

```typescript
// app/(app)/index.tsx

export default function Home() {
    const auth = useAuth();
    
    // 根据认证状态返回不同视图
    if (!auth.isAuthenticated) {
        return <NotAuthenticated />;
    }
    return <Authenticated />;
}

function Authenticated() {
    // 直接返回 MainView, 传入 'phone' 变体
    // SidebarNavigator 会根据设备类型选择合适的布局
    return <MainView variant="phone" />;
}

function NotAuthenticated() {
    const isLandscape = useIsLandscape();
    
    // 处理纵横屏的不同布局
    return (
        <>
            <HomeHeaderNotAuth />
            {isLandscape ? landscapeLayout : portraitLayout}
        </>
    );
}

// 样式:
const styles = StyleSheet.create((theme) => ({
    // Portrait:
    portraitContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    
    // Landscape:
    landscapeContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 48
    },
    landscapeInner: {
        flexGrow: 1,
        maxWidth: 800,
        flexDirection: 'row'
    }
}));
```

---

## 平台特定行为

### iOS 特定
- 使用 Platform.isPad 检测 iPad
- Header 高度: iPhone 44pt, iPad 50pt
- 返回按钮: chevron-back
- 标题对齐: 居中

### Android 特定
- 使用计算的对角线尺寸检测平板
- Header 高度: Phone 56dp (纵) / 48dp (横), Tablet 64dp
- 返回按钮: arrow-back
- 标题对齐: 左对齐
- 平台特定颜色 (e.g., 开关颜色)

### Web 特定
- Header 高度: 56px
- 支持三列布局 (规划中)
- CSS 变量支持
- 无安全区域需求 (insets = 0)

### Mac Catalyst 特定
- 检测方式: Platform.isPad + Version 字符串检查
- Header 高度: 56px (桌面风格)
- 支持无限宽度布局

---

## 性能考虑

### 1. 组件 Memoization
```typescript
// 所有主要组件使用 React.memo
export const SidebarNavigator = React.memo(() => {...});
export const MainView = React.memo(({ variant }: MainViewProps) => {...});
export const TabBar = React.memo(({ activeTab, onTabPress }) => {...});
```

### 2. 计算缓存
```typescript
// 抽屉宽度缓存
const drawerWidth = React.useMemo(() => {
    return Math.min(Math.max(Math.floor(windowWidth * 0.3), 250), 360);
}, [windowWidth, showPermanentDrawer]);

// 导航选项缓存
const drawerNavigationOptions = React.useMemo(() => {
    return { ... };
}, [showPermanentDrawer, drawerWidth]);
```

### 3. Hook 使用
```typescript
// 仅在需要时订阅尺寸变化
const { width, height } = useWindowDimensions();

// 仅在改变时重新计算
const headerHeight = useHeaderHeight();
```

---

## 实验性功能系统

应用包含一个实验性功能开关系统，允许用户启用/禁用正在开发中的功能。

### 配置位置
```typescript
// 从 sync/storage 获取用户设置
const settings = useSettings();

// 检查实验性功能是否启用
if (settings.experiments) {
    // 显示实验性功能
}
```

### 受影响的 UI 元素

#### 1. **Zen 标签** (MainView 和 TabBar)
```typescript
// MainView.tsx: 默认标签页选择
const [activeTab, setActiveTab] = React.useState<TabType>(
    settings.experiments ? 'zen' : 'chats'  // 实验模式默认 Zen 标签
);

// TabBar.tsx: 标签显示
const tabs = React.useMemo(() => {
    const baseTabs = [];

    // Zen 标签优先（如果启用实验功能）
    if (settings.experiments) {
        baseTabs.push({
            key: 'zen',
            icon: require('@/assets/images/brutalist/Brutalism 3.png'),
            label: 'Zen'
        });
    }

    // 常规标签
    baseTabs.push(
        { key: 'chats', icon: ..., label: t('tabs.chats') },
        { key: 'boxes', icon: ..., label: t('tabs.boxes') },
        { key: 'me', icon: ..., label: t('tabs.me') },
    );

    return baseTabs;
}, [settings.experiments]);
```

**效果**:
- 实验模式启用：底部标签栏显示 **Zen / Chats / Boxes / Me** (4个标签)
- 实验模式禁用：底部标签栏显示 **Chats / Boxes / Me** (3个标签)

#### 2. **Zen 导航按钮** (SidebarView)
```typescript
// SidebarView.tsx: 侧边栏头部
{settings.experiments && (
    <Pressable onPress={() => router.push('/(app)/zen')} hitSlop={15}>
        <Image
            source={require('@/assets/images/brutalist/Brutalism 3.png')}
            style={[{ width: 32, height: 32 }]}
            tintColor={theme.colors.header.tint}
        />
    </Pressable>
)}
```

**效果**:
- 平板布局的侧边栏头部显示 Zen 快速访问按钮

### 启用/禁用实验功能

实验性功能通过设置页面控制：
```
设置 > 功能 > 实验性功能
```

**注意事项**:
- 实验性功能可能不稳定
- 功能开关是持久化的，重启应用后保持
- Zen 功能目前处于实验阶段，未来可能成为正式功能

---

## Web 平台特定功能

### FaviconPermissionIndicator

Web 平台专用组件，通过 favicon 显示应用权限状态。

```typescript
// RootLayout.tsx
return (
    <>
        <FaviconPermissionIndicator />  // Web only
        {providers}
    </>
);
```

**功能**:
- 监听应用权限模式变化
- 动态更新浏览器标签页的 favicon
- 提供视觉反馈，让用户快速识别应用状态

**权限模式对应的 favicon**:
- `default`: 默认 favicon
- `acceptEdits`: 蓝色 favicon (接受编辑)
- `bypass`: 橙色 favicon (绕过确认)
- `yolo`: 红色 favicon (YOLO 模式)
- 其他模式...

**位置**: client/sources/components/web/FaviconPermissionIndicator.tsx

---

## 关键设计决策

### 1. 移动优先
- 默认使用手机布局
- 平板通过响应式 Hook 检测后切换布局
- Web 当前使用平板布局,未来计划三列

### 2. 永久 vs 模态抽屉
- 平板: 永久抽屉 (总是可见)
- 手机: 模态抽屉 (滑出菜单)
- 动态切换基于 useIsTablet() Hook

### 3. 安全区域
- 使用 react-native-safe-area-context
- 顶部: 头部 padding
- 左右: 水平包装器
- 底部: 标签栏 padding

### 4. 头部高度
- 不硬编码值
- 使用平台感知计算函数
- 支持横屏调整

### 5. 最大宽度约束
- 平板/Web: 800px (可读性)
- 手机: 无限制 (最大化屏幕使用)
- 用于 TabBar 和 Header 中心内容

---

## 现有 vs 规划中的功能

### 已实现
- ✅ 平板永久侧边栏 (SidebarView)
- ✅ 手机底部标签栏 (TabBar)
- ✅ 响应式设备检测 (useIsTablet, useIsLandscape)
- ✅ 自定义导航头部
- ✅ 平台特定样式
- ✅ 亮色/暗色主题
- ✅ OAuth 认证流程
- ✅ 多会话管理

### 规划中 (Web 三列布局)
- 📋 导航栏 (Navigation Rail)
- 📋 可调整侧边栏宽度
- 📋 快捷键支持 (Cmd+1/2/3)
- 📋 URL 基础路由同步
- 📋 持久化用户偏好

---

## 文件树完整参考

```
client/sources/
├── app/
│   ├── _layout.tsx                    # 根布局 + 提供者
│   ├── +html.tsx                      # Web HTML 根
│   ├── callback.tsx                   # OAuth 回调
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── _layout.tsx
│   └── (app)/
│       ├── _layout.tsx                # Stack 导航配置
│       ├── index.tsx                  # 首页
│       ├── session/
│       ├── settings/
│       ├── zen/
│       ├── boxes/
│       ├── artifacts/
│       ├── terminal/
│       ├── restore/
│       ├── machine/
│       ├── new/
│       ├── dev/
│       └── changelog.tsx
├── components/
│   ├── SidebarNavigator.tsx           # 平板/手机切换
│   ├── SidebarView.tsx                # 左侧导航栏
│   ├── MainView.tsx                   # 手机/侧边栏变体
│   ├── TabBar.tsx                     # 底部标签栏
│   ├── ChatHeaderView.tsx             # 聊天头部
│   ├── SessionsListWrapper.tsx
│   ├── navigation/
│   │   └── Header.tsx                 # 自定义导航头
│   ├── layout.ts                      # 布局约束常量
│   └── [70+ 其他组件]
├── utils/
│   ├── responsive.ts                  # 响应式 Hook
│   ├── deviceCalculations.ts          # 设备计算函数
│   ├── platform.ts                    # 平台检测
│   └── [30+ 其他工具]
├── hooks/
│   ├── useVisibleSessionListViewData.ts
│   ├── useHappyAction.ts
│   └── [20+ 其他 Hook]
├── unistyles.ts                       # Unistyles 配置
├── theme.ts                           # 主题定义
├── theme.css                          # CSS 主题
├── theme.light.json                   # JSON 主题数据
├── theme.dark.json
├── auth/                              # 认证逻辑
├── components/                        # UI 组件
├── constants/                         # 常量
├── modal/                             # 模态框系统
├── sync/                              # 数据同步
├── services/                          # API 服务
├── store/                             # 状态管理
├── text/                              # i18n
└── assets/
    ├── fonts/
    ├── images/
    │   └── brutalist/                 # Tab 图标
    └── animations/
```

---

## 布局故障排除指南

### 问题: 平板上显示错误的布局
**诊断**:
```typescript
const isTablet = useIsTablet();
const deviceType = useDeviceType();
console.log('isTablet:', isTablet, 'deviceType:', deviceType);
```
**原因**: 可能是对角线计算偏差或 Platform.isPad 检测失败
**解决**: 检查 deviceCalculations.ts 中的阈值

### 问题: 头部在某些设备上重叠内容
**原因**: useHeaderHeight() 返回值不正确
**解决**: 验证平台检测和设备类型

### 问题: Web 上的安全区域 padding 过大
**解决**: Web 平台上 insets 应为 0 (无硬件 notch)

### 问题: 响应式样式在某些尺寸下失效
**解决**: 检查 Unistyles 断点定义和 mq 查询

---

## 最佳实践

1. **始终使用 Hook 获取尺寸**: useWindowDimensions, useIsTablet
2. **缓存计算结果**: useMemo 用于复杂计算
3. **样式使用 Unistyles**: StyleSheet.create 而非内联样式
4. **平台检查**: 仅在必要时使用 Platform.OS
5. **测试响应式**: 在多个设备尺寸上测试
6. **安全区域处理**: 总是考虑 notch 和 home indicator
7. **头部配置**: 在 _layout.tsx 中配置,避免在页面中覆盖

---

## 相关文档

- **导航简化方案**: `boxes-tab-redesign.md` (Settings 整合方案)
- **用户体验**: `core-user-experience-v2.md` (导航结构和用户流程)
- **架构**: `architecture.md` (系统架构设计)
- **决策**: `/docs/decisions/001-client-technology-stack.md`
- **CLAUDE.md**: `/client/CLAUDE.md` (开发指南)

---

## 📝 文档勘误与更新记录

### 最近更新 (2025-11-07)

本次更新修正了文档中的核心错误，确保与实际源码完全一致。

#### ✅ 已修正的关键问题

1. **RootLayout 初始化流程** (client/sources/app/_layout.tsx)
   - ✅ 修正字体列表：去除不存在的 Medium/Bold 变体，添加 SpaceMono
   - ✅ 补充 `syncRestore` 步骤：数据恢复的关键流程
   - ✅ 修正流程描述：从"加载主题偏好"改为"获取存储的认证凭证"
   - ✅ 添加 AsyncLock 机制说明
   - ✅ 补充双阶段状态管理说明

2. **AuthGuard 认证架构** (client/sources/components/AuthGuard.tsx)
   - ✅ 明确只检查 Logto OAuth 认证，不检查 Happy Server 认证
   - ✅ 修正返回值：从 `<Redirect>` 改为 `<LoginScreen />`
   - ✅ 修正组件类型：从 `React.memo` 改为普通函数组件
   - ✅ 补充 HappyAutoLogin 自动登录说明
   - ✅ 添加提供者栈位置图示

3. **Layout 最大宽度配置** (client/sources/components/layout.ts)
   - ✅ 修正 Mac Catalyst 的 `headerMaxWidth`: 无限制 (不是 1400px)
   - ✅ 添加完整的代码实现
   - ✅ 添加不同平台的对照表
   - ✅ 明确区分 `maxWidth` 和 `headerMaxWidth` 的用途

4. **补充缺失的重要内容**
   - ✅ 实验性功能系统：详细说明 Zen 功能的启用机制
   - ✅ FaviconPermissionIndicator：Web 平台 favicon 状态指示器
   - ✅ AsyncLock 防重复机制
   - ✅ StatusBarProvider 提供者位置

#### 📋 待完善事项

以下内容准确但可以进一步扩展：

- 主题颜色细节：可以区分 iOS 和 Android 的平台差异
- Mac Catalyst 检测机制：补充 `react-native-device-info` 的使用说明
- Drawer 宽度计算：补充响应式变化的说明

#### 🔍 验证方法

如需验证文档准确性，请参考以下源码位置：

| 文档章节 | 源码位置 | 行号参考 |
|---------|---------|---------|
| RootLayout 初始化 | client/sources/app/_layout.tsx | 70-186 |
| AuthGuard 认证 | client/sources/components/AuthGuard.tsx | 30-55 |
| Layout 配置 | client/sources/components/layout.ts | 6-44 |
| 设备检测 | client/sources/utils/deviceCalculations.ts | 34-52 |
| 响应式 Hook | client/sources/utils/responsive.ts | 全文 |
| 主题配置 | client/sources/unistyles.ts | 11-65 |

---

**文档版本**: v2.0
**最后验证时间**: 2025-11-07
**验证基准**: main 分支最新代码 (commit: 658cb8c)

