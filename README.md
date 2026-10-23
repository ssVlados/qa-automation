# Лабораторна робота № 1

**Дисципліна:** Автоматизація тестування
**Тема:** Розгортання середовища автоматизації тестування. Структура проєкту та перший автоматизований тест
**Виконавець:** Стрижак Владислав, група ВАШЕ_ГРУПА

## Структура проєкту

```
qa-automation/
├── src/                  # вихідний код
│   └── temperature.ts
├── tests/                # автоматизовані тести
│   └── temperature.test.ts
├── .gitignore
├── .prettierrc
├── eslint.config.mjs
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## Встановлення

Потрібні Node.js 20 або новіший і Git.

```
git clone https://github.com/ssVlados/qa-automation.git
cd qa-automation
npm install
```

Якщо `npm install` завершується помилкою `Cannot read properties of null (reading 'edgesOut')`, виконайте:

```
npm install --legacy-peer-deps
```

## Запуск

| Команда | Призначення |
|---|---|
| `npm test` | одноразовий прогін тестів |
| `npm run test:watch` | режим спостереження |
| `npm run coverage` | прогін із вимірюванням покриття |
| `npm run lint` | статичний аналіз коду |
| `npm run format` | форматування коду |