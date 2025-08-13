import argparse
import json
from datasets import load_dataset
from transformers import AutoModelForCausalLM, AutoTokenizer, TrainingArguments
from peft import LoraConfig, get_peft_model
from trl import SFTTrainer

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--model', required=True)
    parser.add_argument('--dataset', required=True)
    parser.add_argument('--out', required=True)
    args = parser.parse_args()

    tokenizer = AutoTokenizer.from_pretrained(args.model, use_fast=True)
    tokenizer.pad_token = tokenizer.eos_token

    def ds_gen():
        with open(args.dataset, 'r') as f:
            for line in f:
                ex = json.loads(line)
                instr = ex.get('instruction', '')
                inp = ex.get('input', '')
                resp = ex.get('response', '')
                text = f"Instruction: {instr}\nInput: {inp}\nResponse: {resp}"
                yield { 'text': text }

    ds = load_dataset('json', data_files=args.dataset, split='train')

    model = AutoModelForCausalLM.from_pretrained(args.model, device_map='auto')
    peft_config = LoraConfig(r=8, lora_alpha=32, lora_dropout=0.05, task_type='CAUSAL_LM')
    model = get_peft_model(model, peft_config)

    training_args = TrainingArguments(
        output_dir=args.out,
        per_device_train_batch_size=1,
        gradient_accumulation_steps=8,
        learning_rate=2e-4,
        num_train_epochs=1,
        logging_steps=10,
        save_steps=100,
        save_total_limit=1
    )

    trainer = SFTTrainer(
        model=model,
        train_dataset=ds,
        peft_config=peft_config,
        tokenizer=tokenizer,
        dataset_text_field='text',
        max_seq_length=1024,
        args=training_args
    )
    trainer.train()
    trainer.model.save_pretrained(args.out)
    print('Saved LoRA adapter to', args.out)

if __name__ == '__main__':
    main()



