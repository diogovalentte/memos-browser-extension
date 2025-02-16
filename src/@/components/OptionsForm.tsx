// ./OptionsForm.tsx

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/Form.tsx';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  optionsFormSchema,
  optionsFormValues,
} from '../lib/validators/optionsForm.ts';
import { Input } from './ui/Input.tsx';
import { Button } from './ui/Button.tsx';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  clearConfig,
  getConfig,
  isConfigured,
  saveConfig,
} from '../lib/config.ts';
import { Toaster } from './ui/Toaster.tsx';
import { Popover, PopoverContent, PopoverTrigger } from './ui/Popover.tsx';
import { CaretSortIcon } from '@radix-ui/react-icons';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from './ui/Command.tsx';
import { toast } from '../../hooks/use-toast.ts';
import { AxiosError } from 'axios';
import { clearBookmarksMetadata } from '../lib/cache.ts';
import { getUserStatus } from '../lib/auth/auth.ts';

const OptionsForm = () => {
  const [openVisibility, setOpenVisibility] = useState<boolean>(false);
  const visibilityOptions = [
    { name: 'Public' },
    { name: 'Private' },
    { name: 'Workspace' },
  ];

  const form = useForm<optionsFormValues>({
    resolver: zodResolver(optionsFormSchema),
    defaultValues: {
      baseUrl: 'https://memos.domain.com',
      apiKey: '',
      defaultVisibility: {
        name: 'Public',
      },
    },
  });

  const { mutate: onReset, isLoading: resetLoading } = useMutation({
    mutationFn: async () => {
      const configured = await isConfigured();

      if (!configured) {
        return new Error('Not configured');
      }

      return;
    },
    onError: () => {
      toast({
        title: 'Error',
        description:
          "Either you didn't configure the extension or there was an error while trying to log out. Please try again.",
        variant: 'destructive',
      });
      return;
    },
    onSuccess: async () => {
      // Reset the form
      form.reset({
        baseUrl: '',
        apiKey: '',
        defaultVisibility: {
            name: 'Public',
        },
      });
      await clearConfig();
      await clearBookmarksMetadata();
      return;
    },
  });

  const { mutate: onSubmit, isLoading } = useMutation({
    mutationFn: async (values: optionsFormValues) => {
      values.baseUrl = values.baseUrl.replace(/\/$/, '');
      // Do API call to test the connection and save the values

        return {
          ...values,
          data: {
            response: {
              token: values.apiKey,
            },
          } as {
            response: {
              token: string;
            };
          },
        };
    },
    onError: (error) => {
      // Handle errors appropriately
      if (error instanceof AxiosError) {
        if (error.response?.status === 401) {
          toast({
            title: 'Error',
            description: 'Invalid credentials or API Key',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Error',
            description: 'Something went wrong, try again please.',
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Error',
          description: 'Something went wrong, check your values are correct.',
          variant: 'destructive',
        });
      }
    },
    onSuccess: async (values) => {
      const userStatus = await getUserStatus(values.baseUrl, values.apiKey);
    
      let visibility = 'Public';
      if (values.defaultVisibility) {
        visibility = values.defaultVisibility.name;
      }
      await saveConfig({
        baseUrl: values.baseUrl,
        apiKey:  values.apiKey,
        user: userStatus.name,
        defaultVisibility: { name: visibility },
      });

      toast({
        title: 'Saved',
        description:
          'Your settings have been saved, you can now close this tab.',
        variant: 'default',
      });
    },
  });

  useEffect(() => {
    (async () => {
      const configured = await isConfigured();
      if (configured) {
        const cachedOptions = await getConfig();
        form.reset(cachedOptions);
      }
    })();
  }, [form]);

  const { handleSubmit, control } = form;

  return (
    <div>
      <Form {...form}>
        <form
          onSubmit={handleSubmit((data) => onSubmit(data))}
          className="space-y-3 p-2"
        >
          <FormField
            control={control}
            name="baseUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL</FormLabel>
                <FormDescription>
                  The address of the Memos instance.
                </FormDescription>
                <FormControl>
                  <Input
                    placeholder="https://memos.domain.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

            <FormField
              control={control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>API Key</FormLabel>
                  <FormDescription>
                    Enter your Memos API Key.
                  </FormDescription>
                  <FormControl>
                    <Input
                      placeholder="Your API Key"
                      {...field}
                      type="password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          <FormField
            control={control}
            name="defaultVisibility"
            render={({ field }) => (
              <FormItem className={`my-2`}>
                <FormLabel>Visibility</FormLabel>
                <div className="min-w-full inset-x-0">
                  <Popover
                    open={openVisibility}
                    onOpenChange={setOpenVisibility}
                  >
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openVisibility}
                          className={
                            'w-full justify-between bg-neutral-100 dark:bg-neutral-900'
                          }
                        >
                          {field.value?.name
                            ? visibilityOptions?.find(
                                (option: { name: string }) =>
                                  option.name === field.value?.name
                              )?.name || form.getValues('defaultVisibility')?.name
                            : 'Select visibility...'}
                          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>

                      <PopoverContent
                        className={`min-w-full p-0 overflow-y-auto max-h-[200px]`}
                      >
                        <Command className="flex-grow min-w-full dropdown-content">
                          <CommandInput
                            className="min-w-[280px]"
                            placeholder="Search visibility..."
                          />
                          <CommandEmpty>No visibility found.</CommandEmpty>
                          {Array.isArray(visibilityOptions) && (
                            <CommandGroup className="w-full">
                              {
                                visibilityOptions?.map(
                                  (option: {
                                    name: string;
                                  }) => (
                                    <CommandItem
                                      value={option.name}
                                      onSelect={() => {
                                        form.setValue('defaultVisibility', {
                                          name: option.name,
                                        });
                                        setOpenVisibility(false);
                                      }}
                                    >
                                      {option.name}
                                    </CommandItem>
                                  )
                                )
                              }
                            </CommandGroup>
                          )}
                        </Command>
                      </PopoverContent>
                  </Popover>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Commented out fields */}
          {/* 
          <FormField
            control={control}
            name="defaultCollection"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Default collection</FormLabel>
                <FormDescription>
                  Default collection to add bookmarks to.
                </FormDescription>
                <FormControl>
                  <Input placeholder="Unorganized" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          */}

          {/* 
          <FormField
            control={control}
            name="syncBookmarks"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sync Bookmarks (Experimental)</FormLabel>
                <FormDescription>
                  Sync your bookmarks with Linkwarden.
                </FormDescription>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          */}

          <div className="flex justify-between">
            <div>
              {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
              {/*@ts-ignore*/}
              <Button
                type="button"
                className="mb-2"
                onClick={() => onReset()}
                disabled={resetLoading}
              >
                Reset
              </Button>
            </div>
            <Button disabled={isLoading} type="submit">
              Save
            </Button>
          </div>
        </form>
      </Form>
      <Toaster />
    </div>
  );
};

export default OptionsForm;
