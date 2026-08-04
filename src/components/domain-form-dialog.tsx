"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { useDomainStore } from "@/features/domains/domain-store";
import { getErrorMessage } from "@/features/domains/utils";

const initialForm = {
  subdomain: "",
  rootdomain: "",
};

export function DomainFormDialog() {
  const { addDomain, features } = useDomainStore();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) setForm(initialForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const domain = await addDomain({
        subdomain: form.subdomain,
        rootdomain: form.rootdomain,
      });
      toast.success("域名已添加", { description: domain.full_domain });
      handleOpenChange(false);
    } catch (error) {
      toast.error("添加失败", { description: getErrorMessage(error) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button disabled={!features.domainCreate} size="sm">
          <Plus aria-hidden="true" strokeWidth={3} /> 添加域名
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="pr-8 text-lg">添加域名</DialogTitle>
          <DialogDescription>
            通过 DNSHE 注册接口提交 subdomain + rootdomain。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid gap-2.5 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="add-subdomain" className="text-xs">
                子域名
              </Label>
              <Input
                id="add-subdomain"
                required
                autoFocus
                autoComplete="off"
                placeholder="hello"
                value={form.subdomain}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    subdomain: event.target.value,
                  }))
                }
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="add-rootdomain" className="text-xs">
                根域名
              </Label>
              <Input
                id="add-rootdomain"
                required
                autoComplete="off"
                placeholder="example.com"
                value={form.rootdomain}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    rootdomain: event.target.value,
                  }))
                }
                className="h-9"
              />
            </div>
          </div>

          <div className="border-2 border-border bg-main/10 p-2.5 text-xs font-bold text-foreground/80">
            DNSHE 文档当前明确展示的注册参数只有 <code>subdomain</code> 和{" "}
            <code>rootdomain</code>。
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "添加中…" : "添加域名"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
