<!DOCTYPE html>
<html lang="<?php echo e(str_replace('_', '-', app()->getLocale())); ?>" class="<?php echo \Illuminate\Support\Arr::toCssClasses(['dark' => ($appearance ?? 'system') == 'dark']); ?>">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="<?php echo e(csrf_token()); ?>">

    
    <script>
        (function() {
            const appearance = '<?php echo e($appearance ?? 'system'); ?>';

            if (appearance === 'system') {
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                if (prefersDark) {
                    document.documentElement.classList.add('dark');
                }
            }
        })();
    </script>

    
    <style>
        html {
            background-color: oklch(1 0 0);
        }

        html.dark {
            background-color: oklch(0.145 0 0);
        }
    </style>

    <title inertia><?php echo e(config('app.name', 'Laravel')); ?></title>

    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
    <script src="<?php echo e(asset('js/jquery.min.js')); ?>"></script>
    <?php echo app('Tighten\Ziggy\BladeRouteGenerator')->generate(); ?>
    <?php if(app()->environment('local')): ?>
        <?php echo app('Illuminate\Foundation\Vite')->reactRefresh(); ?>
    <?php endif; ?>
    <?php echo app('Illuminate\Foundation\Vite')(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"]); ?>
    <script>
        // Ensure base URL is correctly set for assets
        window.baseUrl = '<?php echo e(url('/')); ?>';

        // Define asset helper function
        window.asset = function(path) {
            return "<?php echo e(asset('')); ?>" + path;
        };
        
        // Define storage helper function
        window.storage = function(path) {
            return "<?php echo e(asset('storage')); ?>/" + path;
        };

        // Set initial locale for i18next
        fetch('<?php echo e(route('initial-locale')); ?>')
            .then(response => response.text())
            .then(locale => {
                window.initialLocale = locale;
            })
            .catch(() => {
                window.initialLocale = 'en';
            });
    </script>
    <?php if (!isset($__inertiaSsrDispatched)) { $__inertiaSsrDispatched = true; $__inertiaSsrResponse = app(\Inertia\Ssr\Gateway::class)->dispatch($page); }  if ($__inertiaSsrResponse) { echo $__inertiaSsrResponse->head; } ?>
</head>

<body class="font-sans antialiased">
    <?php if (!isset($__inertiaSsrDispatched)) { $__inertiaSsrDispatched = true; $__inertiaSsrResponse = app(\Inertia\Ssr\Gateway::class)->dispatch($page); }  if ($__inertiaSsrResponse) { echo $__inertiaSsrResponse->body; } else { ?><div id="app" data-page="<?php echo e(json_encode($page)); ?>"></div><?php } ?>
</body>

</html>
<?php /**PATH /Users/liton/Herd/HRMGo/resources/views/app.blade.php ENDPATH**/ ?>