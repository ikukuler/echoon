# План развития компонентного дизайна EchoOn

> Последнее обновление статуса: 13 августа 2026.
>
> Легенда: ✅ выполнено, 🟡 выполнено частично, ⬜ не начато.

## 0. Статус выполнения

| Этап | Статус | Что уже сделано | Что осталось |
| --- | --- | --- | --- |
| 0. Визуальный baseline | 🟡 | Android-приложение запускалось на физическом устройстве; проверены сборка бандла и отсутствие фатальных runtime-ошибок | Системно снять безопасные screenshots всех состояний; проверить TalkBack, увеличенный шрифт, маленький экран и tablet |
| 1. Токены и шрифты | ✅ | Создан `mobile/src/theme/`; введены семантические цвета, spacing, radii, sizes и typography; исправлен Playfair Bold в `app.json`, hook и Tailwind | Выполнить инструментальную проверку контраста и визуальное сравнение regular/bold на Android и iOS |
| 2. Базовый UI-слой | 🟡 | Реализованы `AppButton`, `IconButton`, `ScreenHeader`, `AppCard`, `StatusBadge`, `FormField`, `FeedbackState`, `SectionHeading` и barrel export | Добавить `AppScreen`; добавить автоматические accessibility/interaction tests |
| 3. Простые экраны | ✅ | Login, Settings и Echo Detail переведены на общие компоненты; части Echo вынесены в renderer; fullscreen image получил доступное закрытие | Ручной TalkBack/VoiceOver QA, keyboard flow и проверка системной Back-кнопки Android |
| 4. Home и EchoCard | ✅ | `FlatList`, refresh, pagination guard, дедупликация, initial/footer errors, memoized `EchoCard`, отдельные link/audio/open targets, image fallback; debug action ограничен `__DEV__` | Добавить interaction-тесты и вручную проверить быстрые refresh/load-more и длинные данные |
| 5. AudioPlayer/Recorder | 🟡 | Оба компонента используют общие токены/controls; добавлены loading/error/progress accessibility states; recorder обрабатывает permission denied и processing | Решить продуктовый вопрос об интерактивном seek; провести реальные сценарии записи, отмены, лимита и смены нескольких audio URI |
| 6. Create Echo | 🟡 | Экран разделён на `create-echo/*`; добавлены typed drafts, validation, recoverable attachment errors, последовательный upload, AbortController, защита повторного submit, сохранение формы при ошибке; удалено лишнее media-library permission | Блокировать submit до валидности формы; добавить draft/attachment tests; вручную проверить image/audio/link, отмену upload и повторную отправку |
| 7. Expo SDK 56 и `@expo/ui` | ⬜ | Не начато; UI-рефакторинг пока остаётся на React Native primitives, что изолирует SDK migration | Сначала закрыть текущий Android QA и расхождение native-конфигурации, затем обновить SDK отдельной серией изменений и внедрять `@expo/ui` точечно |

### 0.1 Выполненные изменения по файлам

- Дизайн-система: `mobile/src/theme/*`, `mobile/src/components/ui/*`.
- Лента и карточки: `mobile/src/screens/HomeScreen.tsx`, `mobile/src/components/echo/echo-card.tsx`.
- Рендер частей Echo: `mobile/src/components/echo/echo-part-renderer.tsx`.
- Простые экраны: `LoginScreen.tsx`, `UserSettingsScreen.tsx`, `EchoDetailScreen.tsx`.
- Медиа: `AudioPlayer.tsx`, `AudioRecorder.tsx`.
- Создание Echo: `CreateEchoScreen.tsx`, `mobile/src/components/create-echo/*`.
- Сеть создания/upload: `mobile/src/services/api.ts` принимает `AbortSignal`; multipart boundary оставлен формироваться `fetch` автоматически.
- Разрешения: удалены дублирующиеся Android storage permissions и зависимость `expo-media-library`; photo/microphone descriptions уточнены.

Текущий этап 6 находится в рабочем дереве и ещё не зафиксирован отдельным коммитом. Это относится к `CreateEchoScreen`, `components/create-echo`, `api.ts`, `app.json`, package manifests и очистке устаревшего `LocalEchoPart`.

### 0.2 Последние подтверждённые проверки

Проверено 13 августа 2026:

```bash
cd mobile
npx tsc --noEmit             # пройдено
npx expo config --type public # пройдено, SDK 53, Android package com.ikukuler.echoon
cd ..
git diff --check             # пройдено
```

Ранее Android bundle успешно собирался и исполнялся на подключённом физическом устройстве. Для старого установленного development client `com.ikukuler.echowave` потребовался USB port reverse; это временное окружение запуска, а не исправление native-конфигурации проекта.

### 0.3 Следующий рабочий срез

1. Завершить этап 6: вычисляемая валидность формы, disabled submit и тесты validation/attachments.
2. Провести Android smoke test Create → upload → success и error/cancel flows; не использовать приватные пользовательские данные.
3. Добавить недостающий `AppScreen` и перевести повторяющиеся корневые контейнеры без изменения поведения экранов.
4. Добавить тесты UI-примитивов, `EchoCard` interactions и Home pagination guards.
5. Закрыть ручную accessibility/large-text матрицу и сохранить безопасный визуальный baseline.
6. Синхронизировать native Android package/scheme (`echowave` → `echoon`) через контролируемый rebuild development client.
7. Только после чистого baseline начать отдельный этап обновления Expo SDK и `@expo/ui`.

## 1. Цель и ожидаемый результат

Цель — превратить текущий набор стилизованных экранов в последовательную, доступную и поддерживаемую компонентную систему, сохранив узнаваемую тёплую визуальную эстетику EchoOn.

После реализации:

- повторяющиеся элементы интерфейса используют единые компоненты и семантические дизайн-токены;
- кнопки, поля, модальные окна и медиаконтролы доступны для VoiceOver/TalkBack;
- главный список виртуализирован и не деградирует при росте числа Echo;
- интерактивные элементы внутри карточек не конфликтуют между собой;
- цвета обычного текста соответствуют WCAG AA;
- состояния loading, empty, error, disabled и destructive выглядят и ведут себя единообразно;
- проект готов к переходу на универсальные компоненты `@expo/ui` после обновления до Expo SDK 56;
- бизнес-логика создания, просмотра и воспроизведения Echo остаётся неизменной.

## 2. Текущие ограничения и исходные условия

- Мобильное приложение находится в `mobile/`.
- Текущая версия Expo: SDK 53 (`expo ~53.0.0`).
- Универсальный API `@expo/ui` требует Expo SDK 56+.
- `@expo/ui` сейчас не установлен.
- Навигация построена на React Navigation, а не Expo Router.
- Стилизация построена на NativeWind 4 и токенах из `mobile/tailwind.config.js`.
- На старте работ экран Home использовал `ScrollView` и `echoes.map`; теперь он переведён на `FlatList` с защищённой пагинацией.
- Изменения следует выполнять без переработки API backend и структуры `Echo`/`EchoPart`.

## 3. Требования и место реализации

| Требование | Где реализуется |
| --- | --- |
| Единые цвета, шрифты, размеры, радиусы и состояния | `mobile/tailwind.config.js`, новый `mobile/src/theme/` |
| Общие кнопки, карточки, заголовки и feedback states | новый `mobile/src/components/ui/` |
| Доступность интерактивных контролов | компоненты `ui/`, затем все экраны и медиакомпоненты |
| Виртуализированный главный список | `mobile/src/screens/HomeScreen.tsx` |
| Устранение вложенных press targets | `HomeScreen.tsx`, `AudioPlayer.tsx` |
| Единый дизайн аудио | `AudioPlayer.tsx`, `AudioRecorder.tsx` |
| Корректное отображение шрифтов | `mobile/app.json`, `mobile/src/hooks/useFonts.ts` |
| Нативные системные контролы | после обновления SDK: `@expo/ui` в Settings, формах и modal/sheet UI |
| Сохранение поведения бизнес-функций | существующие hooks/services без изменения публичных контрактов |

## 4. Целевая архитектура компонентов

Предлагаемая структура:

```text
mobile/src/
  theme/
    colors.ts
    spacing.ts
    typography.ts
    index.ts
  components/
    ui/
      AppScreen.tsx
      ScreenHeader.tsx
      AppButton.tsx
      IconButton.tsx
      AppCard.tsx
      StatusBadge.tsx
      FormField.tsx
      FeedbackState.tsx
      SectionHeading.tsx
      index.ts
    echo/
      EchoCard.tsx
      EchoPartRenderer.tsx
      EchoTextPart.tsx
      EchoImagePart.tsx
      EchoLinkPart.tsx
      EchoAudioPart.tsx
```

### 4.1 Принципы API компонентов

- Компоненты принимают семантические варианты (`primary`, `secondary`, `danger`, `quiet`), а не произвольные цвета.
- `AppButton` и `IconButton` владеют pressed/disabled/loading/accessibility-состояниями.
- `AppCard` отвечает только за surface, border, radius и elevation; бизнес-контент передаётся через children.
- `ScreenHeader` принимает `title`, необязательные `subtitle`, `onBack` и `rightAction`.
- `FeedbackState` покрывает `loading`, `empty` и `error`, но повтор API-запроса передаётся callback-ом экрана.
- `EchoCard` не оборачивает весь сложный контент в один press target, если внутри есть ссылки или аудиоуправление.
- Публичные props компонентов должны быть малыми и типизированными; навигационный объект не передаётся глубоко в UI-компоненты.

## 5. Этапы реализации

### Этап 0. Зафиксировать визуальный baseline

Задачи:

1. Запустить приложение на iOS и Android или на доступных симуляторах.
2. Снять screenshots следующих состояний:
   - Login: вход, регистрация, loading и ошибка;
   - Home: loading, empty, список, refresh и load more;
   - Create Echo: текст, дата/время, image, audio и link;
   - Echo Detail: все виды частей и полноэкранное изображение;
   - Settings: оба состояния переключателя;
   - Audio Recorder: permission denied, ready, recording и processing.
3. Проверить экраны с увеличенным системным размером текста.
4. Записать текущие визуальные расхождения, которые необходимо сохранить как осознанные исключения.

Результат: проверяемый baseline до рефакторинга. Screenshots не должны содержать реальные email, приватные изображения, аудио или ссылки пользователя; использовать тестовый аккаунт и фикстуры.

### Этап 1. Нормализовать дизайн-токены и шрифты

Файлы:

- `mobile/tailwind.config.js`
- `mobile/app.json`
- `mobile/src/hooks/useFonts.ts`
- новые файлы `mobile/src/theme/*`

Задачи:

1. Исправить регистрацию `PlayfairDisplay-Bold`: сейчас family bold указывает на `PlayfairDisplay-Regular.ttf`.
2. Ввести семантические токены:
   - `background`, `surface`, `surfaceElevated`;
   - `content`, `contentMuted`, `contentOnAccent`;
   - `accent`, `accentPressed`, `border`;
   - `success`, `warning`, `danger` и их мягкие поверхности;
   - `scrim` для modal overlay.
3. Заменить `accentSecondary` как цвет мелкого текста на более тёмный токен с контрастом не ниже 4.5:1.
4. Заменить login placeholder `#8AB6D6`, имеющий недостаточный контраст.
5. Зафиксировать шкалы spacing, radius, icon size и touch target.
6. Не делать dark mode в рамках этого этапа: `userInterfaceStyle` сейчас установлен в `light`.

Проверка:

- Playfair regular и bold визуально различаются;
- обычный текст и placeholder проходят WCAG AA;
- в компонентах нет новых случайных hex-цветов за пределами theme/config.

### Этап 2. Создать базовый UI-слой

Файлы: новый каталог `mobile/src/components/ui/`.

Порядок:

1. `AppScreen` — safe-area-aware контейнер с фоном и опциональным scroll behavior.
2. `AppButton` — варианты primary/secondary/danger/quiet, размеры, loading и disabled.
3. `IconButton` — минимальная область 44×44, `hitSlop`, обязательный `accessibilityLabel`.
4. `ScreenHeader` — единый back action, title, subtitle и right action.
5. `AppCard` и `StatusBadge`.
6. `FormField` — label, input slot, hint и error; ошибка связывается с полем семантически.
7. `FeedbackState` — loading/empty/error и необязательный retry action.
8. `SectionHeading` — единый уровень типографической иерархии.

Accessibility-контракт:

- кнопки используют `accessibilityRole="button"`;
- переключатели сообщают checked/disabled state;
- loading-контролы сообщают busy state;
- icon-only control не может быть создан без label;
- декоративные иконки скрыты от screen reader;
- touch target не меньше 44×44 pt/dp;
- цвет не является единственным способом обозначить статус или ошибку.

### Этап 3. Мигрировать простые экраны

#### Login

Файл: `mobile/src/screens/LoginScreen.tsx`.

- заменить локальные button/input styles на `AppButton` и `FormField`;
- добавить видимые labels для email/password вместо зависимости только от placeholder;
- настроить `textContentType`, `autoComplete` и return-key flow;
- добавить inline validation и общий error state;
- terms/privacy отображать как реальные отдельные ссылки либо как обычный текст до появления маршрутов/URL;
- не логировать credentials и значения полей.

#### Settings

Файл: `mobile/src/screens/UserSettingsScreen.tsx`.

- применить `AppScreen`, `ScreenHeader`, `AppCard`, `SectionHeading`, `AppButton`;
- вся строка настройки должна быть понятным label для switch;
- при сохранении показать pending state и не допускать параллельных переключений;
- при ошибке вернуть визуальное значение к подтверждённому сервером/хранилищем состоянию;
- sign out оставить отдельным destructive action, визуально отделённым от обычных настроек.

#### Echo Detail

Файл: `mobile/src/screens/EchoDetailScreen.tsx`.

- применить общий header/status/card;
- вынести части Echo в `EchoPartRenderer`;
- добавить accessibility labels изображениям и кнопке закрытия modal;
- обеспечить закрытие полноэкранного изображения системной кнопкой Back на Android;
- не озвучивать декоративный текст `Tap to view full size` отдельно от изображения.

### Этап 4. Перестроить Home и карточки Echo

Файлы:

- `mobile/src/screens/HomeScreen.tsx`
- новые `mobile/src/components/echo/*`

Задачи:

1. Заменить `ScrollView + echoes.map` на React Native `FlatList`.
2. Настроить:
   - `keyExtractor` по `echo.id`;
   - `renderItem` через memoized `EchoCard`;
   - `ListHeaderComponent` для greeting/create action;
   - `ListEmptyComponent`;
   - `ListFooterComponent` для loading-more/end state;
   - `RefreshControl`;
   - `onEndReached` с защитой от повторных запросов.
3. Удалить production test buttons (`Test Push Notification`, `Test Direct Navigation`) либо показывать их только в `__DEV__` debug section.
4. Разделить press targets:
   - карточка/кнопка `Open Echo` открывает detail;
   - link открывает URL и не вызывает навигацию карточки;
   - audio controls управляют только воспроизведением;
   - status badge не является кнопкой.
5. Не использовать `@expo/ui List` для ленты: он не предназначен для больших динамических списков.
6. Обработать image failure явным fallback вместо пустой области.

Поток состояния списка:

```text
initial -> loading -> data | empty | error
data -> refreshing -> refreshed data | prior data + non-blocking error
data -> loadingMore -> appended data | prior data + footer error
```

Failure behavior:

- initial load error показывает полноэкранный retry state;
- refresh error сохраняет уже показанные данные;
- load-more error сохраняет список и показывает retry в footer;
- повторный `onEndReached` игнорируется, пока запрос активен;
- дубликаты по `echo.id` не добавляются при гонках refresh/load-more.

### Этап 5. Унифицировать медиакомпоненты

#### AudioPlayer

Файл: `mobile/src/components/AudioPlayer.tsx`.

- применить семантические цвета и общие icon buttons;
- сделать progress bar доступным: озвучивать elapsed/total time;
- если seek нужен пользователю, заменить декоративную полоску на реально управляемый slider; иначе удалить неиспользуемый `seekTo`;
- добавить состояния loading/error/unavailable;
- play/pause должен иметь динамический label и state;
- stop должен сбрасывать визуальную позицию;
- гарантировать unload предыдущего sound при смене URI и unmount.

#### AudioRecorder

Файл: `mobile/src/components/AudioRecorder.tsx`.

- заменить несогласованные blue/gray стили семантическими токенами;
- убрать дублирующие `Cancel`/`Close` либо чётко разделить их смысл;
- сделать permission denied отдельным recoverable state с переходом в Settings, если повторный запрос ОС невозможен;
- не запрашивать media-library permission, если сохранение записи в галерею не является обязательной продуктовой функцией;
- блокировать dismiss или явно подтверждать отмену во время активной записи;
- отображать достижение лимита и processing state доступно, не только цветом/анимацией;
- при ошибке остановки сохранить возможность безопасно закрыть modal.

Поток recorder:

```text
permissionUnknown -> requestingPermission -> ready | permissionDenied
ready -> starting -> recording -> stopping -> completed
recording -> cancelling -> ready
любое async state -> recoverableError
```

### Этап 6. Улучшить Create Echo

Файл: `mobile/src/screens/CreateEchoScreen.tsx`.

- применить общие screen/header/button/form/card компоненты;
- разделить длинный JSX на секции и attachment components;
- у каждого attachment должны быть понятные label, type, remove action и validation state;
- date/time controls должны выглядеть как значения формы, а не как произвольные карточки;
- link validation должна сообщаться текстом и accessibility state, не только green/red цветом;
- submit button disabled, пока форма невалидна или выполняется upload/create;
- при ошибке создания не очищать введённый контент;
- при успешном создании навигация выполняется один раз;
- изображения и аудио должны показывать upload/progress/error независимо друг от друга.

### Этап 7. Обновить Expo и внедрить `@expo/ui`

Этот этап выполнять отдельно от компонентного рефакторинга, чтобы SDK migration и визуальные изменения можно было проверять независимо.

#### 7.1 Обновление SDK

Затрагиваемые ресурсы:

- `mobile/package.json`
- `mobile/package-lock.json`
- `mobile/app.json`
- Expo SDK, React Native, React, NativeWind, Reanimated и Expo modules;
- native projects, если они генерируются локально командой prebuild/run.

Порядок:

1. Зафиксировать чистый passing baseline.
2. Последовательно пройти официальные Expo upgrade steps для промежуточных SDK при необходимости.
3. Запустить `npx expo install --fix` и `npx expo-doctor`.
4. Проверить breaking changes `expo-av`: если целевой SDK требует/рекомендует новые audio packages, мигрировать отдельно с сохранением UI-контракта.
5. Проверить notifications, fonts, image picker, media library, NativeWind, Reanimated и React Navigation.
6. Только после стабильного SDK 56 установить `@expo/ui` через `npx expo install @expo/ui`.

Rollback: обновление SDK должно быть отдельной серией коммитов; при критической несовместимости UI-рефакторинг остаётся работоспособным на RN-компонентах.

#### 7.2 Кандидаты для `@expo/ui`

- Settings: универсальные `Host`, `FieldGroup`, `Switch`, `Button`.
- Стандартные действия: `Button` и `Icon` внутри небольших `Host`-деревьев.
- Формы: универсальный `TextInput` только после принятия модели `useNativeState` и установки необходимых worklets.
- Recorder/presentation: `BottomSheet`, если его API покрывает dismissal и recording states.
- Disclosure settings: `Collapsible`, если появятся дополнительные настройки.
- Date/time: проверить актуальный `@expo/ui` replacement/API по установленным TypeScript definitions.

Не мигрировать без явной пользы:

- `FlatList` и ленту Echo;
- сложные медиа-карточки;
- изображения и кастомный playback UI;
- весь экран в platform-specific SwiftUI/Compose только ради внешнего вида.

Каждое дерево `@expo/ui` оборачивается в `Host`, импортированный из корня `@expo/ui`. Platform-specific imports допускаются только в `.ios.tsx`/`.android.tsx` компонентах, не в общих файлах.

## 6. Стратегия изменений и рекомендуемые коммиты

Изменения лучше делать маленькими независимыми коммитами:

1. `fix(mobile): register Playfair bold font correctly`
2. `refactor(mobile): add semantic design tokens`
3. `feat(mobile-ui): add accessible button and icon button primitives`
4. `feat(mobile-ui): add screen, header, card and feedback primitives`
5. `refactor(mobile): migrate login and settings to UI primitives`
6. `refactor(mobile): extract echo part renderer`
7. `perf(mobile): virtualize the home echo list`
8. `fix(mobile): separate nested echo card interactions`
9. `refactor(mobile): unify audio player and recorder UI`
10. `refactor(mobile): split create echo form into components`
11. `chore(mobile): upgrade Expo SDK to 56`
12. `feat(mobile): adopt targeted universal expo-ui controls`

Не смешивать обновление SDK, массовую замену компонентов и изменение бизнес-логики в одном коммите.

## 7. Валидация

### Автоматические проверки

Из каталога `mobile/`:

```bash
npx tsc --noEmit
npx expo-doctor
npx expo export --platform android
npx expo export --platform ios
```

Если в проект добавляются test/lint scripts, также запускать:

```bash
npm run lint
npm test
```

Для UI-примитивов желательно добавить React Native Testing Library и проверить:

- accessibility role/label/state;
- disabled/loading press behavior;
- FormField error rendering;
- EchoCard не вызывает open-detail при нажатии link/audio control;
- состояния FeedbackState;
- дедупликацию и защиту пагинации.

### Ручная проверка

- iOS и Android, минимум по одному устройству/симулятору;
- light mode — обязательный; dark mode не заявлен;
- VoiceOver и TalkBack на основных flow;
- Dynamic Type / увеличенный размер шрифта;
- маленький телефон и tablet layout;
- клавиатура не перекрывает поля и submit;
- slow network/offline/API failure;
- denied microphone/photos/media permissions;
- длинные email, ссылки, имена и тексты Echo;
- изображения разных aspect ratios;
- несколько audio parts на одном экране;
- rapid taps, повторный submit и быстрый refresh/load-more.

## 8. Privacy и security

- Не включать пользовательские Echo, email, изображения, аудиофайлы, push tokens и URL в screenshots, fixtures и логи.
- Удалить или ограничить `__DEV__` существующие debug/test actions на Home.
- Не логировать auth credentials, полный пользовательский контент и локальные media URI в production.
- Перед открытием внешней ссылки показывать понятный домен; разрешать только ожидаемые схемы (`https`, при продуктовой необходимости `http`).
- Не запрашивать media-library permission без функциональной необходимости; применять принцип минимальных разрешений.
- Ошибки UI не должны показывать пользователю внутренние API payloads или stack traces.
- Accessibility labels не должны раскрывать скрытый/недоставленный Echo-контент на lock screen или в системных поверхностях.

## 9. Риски и способы снижения

| Риск | Снижение риска |
| --- | --- |
| SDK upgrade ломает Expo modules | отдельный этап и коммиты, `expo-doctor`, проверка модулей по одному |
| `@expo/ui` API меняется между SDK | сверяться с `.d.ts` установленной версии, а не только с latest docs |
| Рефакторинг карточек меняет навигацию | interaction tests и ручная проверка nested controls |
| FlatList вызывает повторную пагинацию | request guard, stable callbacks, дедупликация по ID |
| Dynamic Type ломает headers/cards | не фиксировать высоту текстовых контейнеров, проверять большие размеры |
| Новые токены визуально меняют бренд | baseline screenshots и поэкранное сравнение |
| NativeWind и `@expo/ui` дают две системы styling | NativeWind использовать для RN custom UI, нативные modifiers/API — внутри изолированных `@expo/ui` компонентов |

## 10. Открытые вопросы

Перед соответствующим этапом требуется продуктово-техническое решение:

1. Нужна ли полноценная поддержка web, или приоритет только iOS/Android? Это влияет на объём применения универсального `@expo/ui`.
2. Следует ли полностью удалить debug-кнопки Home или оставить их в `__DEV__`?
3. Должна ли запись автоматически сохраняться в системную медиатеку? Если нет, media-library permission следует убрать.
4. Нужен ли интерактивный seek в `AudioPlayer`? Сейчас функция существует, но UI её не вызывает.
5. Должна ли вся Echo-card открывать detail, когда внутри есть собственные интерактивные части, или нужен явный CTA?
6. Планируется ли dark mode? Сейчас приложение принудительно light; добавление dark mode потребует второй полной палитры и отдельной QA-матрицы.
7. Нужно ли поддерживать tablets как полноценный adaptive layout? `supportsTablet` включён, но текущие экраны в основном рассчитаны на телефонную ширину.

До получения ответов безопасные допущения: mobile-first iOS/Android, light mode, debug actions только в `__DEV__`, явный CTA для сложной Echo-card, отсутствие автоматического сохранения аудио в медиатеку и сохранение текущего React Navigation.

## 11. Definition of Done

Работа считается завершённой, когда:

- все повторяющиеся controls основных экранов используют общий UI-слой;
- Home использует `FlatList`, корректно обрабатывает initial/refresh/load-more/error;
- link/audio controls не запускают переход карточки;
- основные press targets имеют role, label, state и размер не меньше 44×44;
- контраст обычного текста и placeholders соответствует WCAG AA;
- Playfair bold использует правильный font asset;
- Login, Home, Create Echo, Echo Detail, Settings, AudioPlayer и AudioRecorder проверены на iOS и Android;
- TypeScript, Expo Doctor и platform export проходят;
- denial permissions, offline/API failure и media errors имеют восстанавливаемое поведение;
- production UI не содержит debug/test actions и чувствительных логов;
- применение `@expo/ui` ограничено компонентами, где нативный API даёт реальную пользу, и подтверждено на SDK 56 установленными types.
