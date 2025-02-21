import { useForm } from 'react-hook-form';
import browser from 'webextension-polyfill';
import { encodeURL } from '../../@/lib/utils.ts';
import { DateTime } from 'luxon';
import { CaretSortIcon } from '@radix-ui/react-icons';
import {
  memoFormSchema,
  memoFormValues,
} from '../lib/validators/memoForm.ts';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/Form.tsx';
import { Input } from './ui/Input.tsx';
import { Button } from './ui/Button.tsx';
import { TagInput } from './TagInput.tsx';
import { Textarea } from './ui/Textarea.tsx';
import { checkDuplicatedItem, getCurrentTabInfo } from '../lib/utils.ts';
import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getConfig, isConfigured } from '../lib/config.ts';
import { postMemo, updateMemo } from '../lib/actions/memos.ts';
import { Popover, PopoverContent, PopoverTrigger } from './ui/Popover.tsx';
import { AxiosError } from 'axios';
import { toast } from '../../hooks/use-toast.ts';
import { Toaster } from './ui/Toaster.tsx';
import { getTags } from '../lib/actions/tags.ts';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from './ui/Command.tsx';

async function saveToArchive(url: string) {
    fetch(`https://web.archive.org/save/${encodeURIComponent(url)}`)
        .catch(console.error);
}

let configured = false;
let duplicated = false;
const BookmarkForm = () => {
  const [state] = useState<'capturing' | 'uploading' | null>(null);
  const [openVisibility, setOpenVisibility] = useState<boolean>(false);
  const visibilityOptions = [
    { name: 'Public' },
    { name: 'Private' },
    { name: 'Workspace' },
  ];

  const form = useForm<memoFormValues>({
    resolver: zodResolver(memoFormSchema),
    defaultValues: {
      url: '',
      tags: [],
      content: '',
      createDate: { date: "", time: "" },
      visibility: {
        name: 'Public',
      },
    },
  });

  const { mutate: onSubmit, isLoading } = useMutation({
    mutationFn: async (values: memoFormValues) => {
      const config = await getConfig();

      if (values.visibility?.name === 'Private') {
        values.visibility = { name: 'PRIVATE' };
      } else if (values.visibility?.name === 'Workspace') {
        values.visibility = { name: 'PROTECTED' };
      } else if (values.visibility?.name === 'Public') {
        values.visibility = { name: 'PUBLIC' };
      }

      const memoData = await postMemo(
        config.baseUrl,
        values,
        config.apiKey
      );

      browser.runtime.sendMessage({
        action: "addContextMenuOptions",
        memoUrl: values.url,
      });

      if (values.createDate.date) {
          let createDate = values.createDate.date;
          let createTime = values.createDate.time;
          if (!createDate) {
            createDate = DateTime.now().toFormat('yyyy-MM-dd');
          }
          if (!createTime) {
            createTime = '00:00:00';
          } else {
            createTime = createTime + ':00';
          }

          const createDateTime = DateTime.fromISO(`${createDate}T${createTime}`, { zone: 'local' });
          await updateMemo(
            config.baseUrl,
            memoData.name,
            createDateTime.toISO(),
            null,
            config.apiKey
          );
      }

      return;
    },
    onError: (error) => {
      console.error(error);
      if (error instanceof AxiosError) {
        toast({
          title: 'Error',
          content:
            error.response?.data.response ||
            'There was an error while trying to save the memo. Please try again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          content:
            'There was an error while trying to save the memo. Please try again.',
          variant: 'destructive',
        });
      }
      return;
    },
    onSuccess: (_, values) => {
      saveToArchive(values.url);
      toast({
        title: 'Success',
        description: 'Memo saved successfully!',
      });
      setTimeout(() => {
        window.close();
        // I want to show some confirmation before it's closed...
      }, 3500);
    },
  });

  const { handleSubmit, control } = form;

  useEffect(() => {
    getCurrentTabInfo().then(({ url, title }) => {
      getConfig().then(() => {
        url = url ? url : '';
        title = title ? title : '';
        form.setValue('url', url);
        form.setValue('content', `# ${title}\n- [Source](${encodeURL(url)})`);
      });
    });
    const getConfigUse = async () => {
      const config = await getConfig();
      form.setValue('visibility', {
        name: config.defaultVisibility.name,
      });
      configured = await isConfigured();
      duplicated = await checkDuplicatedItem();
    };
    getConfigUse();
  }, [form]);

  const {
    isLoading: loadingTags,
    data: tags,
    error: tagsError,
  } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => {
      const config = await getConfig();

      const response = await getTags(config.baseUrl, config.apiKey, config.user);

      return response.data.response.sort((a, b) => {
        return a.name.localeCompare(b.name);
      });
    },
    enabled: configured,
  });

  return (
    <div>
      <Form {...form}>
        <form onSubmit={handleSubmit((e) => onSubmit(e))} className="py-1">
            <div className="details list-none space-y-5 pt-2">
              {tagsError ? <p>There was an error...</p> : null}
              <FormField
                control={control}
                name="visibility"
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
                                  )?.name || form.getValues('visibility')?.name
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
                                            form.setValue('visibility', {
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
              <FormField
                control={control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    {loadingTags ? (
                      <TagInput
                        onChange={field.onChange}
                        value={[{ name: 'Getting tags...' }]}
                        tags={[{ id: 1, name: 'Getting tags...' }]}
                      />
                    ) : tagsError ? (
                      <TagInput
                        onChange={field.onChange}
                        value={[{ name: 'Not found' }]}
                        tags={[{ id: 1, name: 'Not found' }]}
                      />
                    ) : (
                      <TagInput
                        onChange={field.onChange}
                        value={field.value ?? []}
                        tags={tags}
                      />
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Content..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                <FormField
                  control={control}
                  name="createDate.date"
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormLabel>Create Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          placeholder="Create date..."
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(e.target.value)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="createDate.time"
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormControl>
                        <Input
                          type="time"
                          placeholder="Create time..."
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(e.target.value)
                          }
                        />
                      </FormControl>
                      {/* <FormMessage /> */}
                    </FormItem>
                  )}
                />
              </div>
              <FormMessage>
                {form.formState.errors?.createDate?.time?.message || ""}
              </FormMessage>
            </div>
          {duplicated && (
            <p className="text-muted text-zinc-600 dark:text-zinc-400 mt-2">
              You already have a recent memo for this link.
            </p>
          )}
          <div className="flex justify-between items-center mt-4">
            <Button disabled={isLoading} type="submit">
              Save
            </Button>
          </div>
        </form>
      </Form>
      <Toaster />
      {state && (
        <div className="fixed inset-0 bg-black backdrop-blur-md bg-opacity-50 flex items-center justify-center">
          <div className="text-white p-4 rounded-md flex flex-col items-center w-fit">
            <svg
              className="animate-spin h-10 w-10"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>

            <p className="text-xl mt-1">
              {state === 'capturing'
                ? 'Capturing the page...'
                : 'Uploading image...'}
            </p>
            <p className="text-xs text-center max-w-xs">
              Please do not close this window, this may take a few seconds
              depending on the size of the page.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookmarkForm;
