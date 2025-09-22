"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { PublicKey } from "@solana/web3.js";
import { toast } from "sonner";

const AMOUNT_OPTIONS = [5, 10, 50, 100, 200];

const formSchema = z.object({
  walletAddress: z.string().refine(
    (val) => {
      try {
        new PublicKey(val);
        return true;
      } catch {
        return false;
      }
    },
    {
      message: "Invalid Solana wallet address",
    }
  ),
  amount: z.string(),
});

interface FaucetResponse {
  success: boolean;
  txSignature?: string;
  error?: string;
  remainingRequests?: number;
}

export const FaucetAirdropForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [remainingRequests, setRemainingRequests] = useState<number | null>(
    null
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      walletAddress: "",
      amount: undefined,
    },
  });

  const fetchRemainingRequests = async (walletAddress: string) => {
    try {
      const response = await fetch(
        `/api/faucet?walletAddress=${encodeURIComponent(walletAddress)}`
      );
      const data: FaucetResponse = await response.json();
      if (data.success && data.remainingRequests !== undefined) {
        setRemainingRequests(data.remainingRequests);
      }
    } catch (error) {
      console.error("Error fetching remaining requests:", error);
    }
  };

  const walletAddress = form.watch("walletAddress");

  useEffect(() => {
    if (walletAddress && form.formState.errors.walletAddress === undefined) {
      const timeoutId = setTimeout(() => {
        fetchRemainingRequests(walletAddress);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [walletAddress, form.formState.errors.walletAddress]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/faucet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: values.walletAddress,
          amount: parseInt(values.amount),
        }),
      });

      const data: FaucetResponse = await response.json();

      if (data.success) {
        toast.success(`Airdrop successful! Transaction: ${data.txSignature}`);
        setRemainingRequests(data.remainingRequests ?? null);
        form.reset();
      } else {
        toast.error(data.error || "Airdrop failed");
        setRemainingRequests(data.remainingRequests ?? null);
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
      console.error("Airdrop error:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 max-w-[500px] w-full border border-border p-8 py-14 rounded-2xl"
      >
        <div className="flex items-center flex-col pb-8">
          <h3 className="text-2xl text-white font-bold text-center">
            Request USD Faucet
          </h3>
          <p className="text-base text-gray-400 text-center pt-4">
            Maximum of $200 every 24 hours
          </p>
          {remainingRequests !== null && (
            <p className="text-sm text-blue-400 text-center pt-2">
              {remainingRequests > 0
                ? `${remainingRequests} request(s) remaining`
                : "No requests remaining (try again in 24 hours)"}
            </p>
          )}
        </div>
        <FormField
          control={form.control}
          name="walletAddress"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Wallet Address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-5 gap-2"
                >
                  {AMOUNT_OPTIONS.map((amount) => (
                    <FormItem key={amount} className="flex items-center gap-3">
                      <FormControl>
                        <RadioGroupItem
                          className="hidden"
                          value={amount.toString()}
                          id={`amount-${amount}`}
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor={`amount-${amount}`}
                        className={cn(
                          "font-normal w-full border border-border cursor-pointer h-10 rounded-md text-center inline-flex items-center justify-center",
                          field.value === amount.toString()
                            ? "border-primary bg-primary text-white"
                            : "border-border"
                        )}
                      >
                        {amount}
                      </FormLabel>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />

        <Button
          className="w-full"
          disabled={
            !form.formState.isValid || isLoading || remainingRequests === 0
          }
          type="submit"
        >
          {isLoading ? "Processing..." : "Send Airdrop"}
        </Button>
      </form>
    </Form>
  );
};
