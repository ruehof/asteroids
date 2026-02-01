export default [
    {
        files: ["js/**/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                window: "readonly",
                document: "readonly",
                performance: "readonly",
                requestAnimationFrame: "readonly",
                Math: "readonly",
                console: "readonly",
            },
        },
        rules: {
            "no-unused-vars": "warn",
            "no-undef": "error",
            "no-const-assign": "error",
            "no-dupe-args": "error",
            "no-dupe-keys": "error",
            "no-duplicate-case": "error",
            "no-unreachable": "error",
            "eqeqeq": "warn",
            "no-var": "warn",
            "prefer-const": "warn",
            "no-shadow": "warn",
        },
    },
];
