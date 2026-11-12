export const MIPS_PRE = {
  fgh: {
    name: 'f = (g + h) − (i + j)  · L05 s12',
    regs: '$s1=10, $s2=20, $s3=3, $s4=4',
    code: `# f in $s0, g $s1, h $s2, i $s3, j $s4
add $t0, $s1, $s2     # t0 = g + h
add $t1, $s3, $s4     # t1 = i + j
sub $s0, $t0, $t1     # f = t0 - t1`
  },
  arr: {
    name: 'A[12] = h + A[8]  · L05 s19',
    regs: '$s2=5',
    code: `.data
A:  .word 0, 1, 2, 3, 4, 5, 6, 7, 40, 9, 10, 11, 0
.text
      la  $s3, A          # $s3 = base address of A (pseudo: lui + ori)
      lw  $t0, 32($s3)    # $t0 = A[8]   (8 × 4 = 32 bytes in)
      add $t0, $s2, $t0   # $t0 = h + A[8]
      sw  $t0, 48($s3)    # A[12] = $t0  (12 × 4 = 48)`
  },
  ps1q6: {
    name: 'B[6] = h − A[4] + B[2]  · PS1 Q6a',
    regs: '$s0=50',
    code: `.data
A:  .word 0, 0, 0, 0, 7, 0, 0, 0
B:  .word 0, 0, 30, 0, 0, 0, 0, 0
.text
      la  $s1, A
      la  $s2, B
      lw  $t0, 8($s2)     # B[2]
      lw  $t1, 16($s1)    # A[4]
      sub $t1, $s0, $t1   # h - A[4]
      add $t0, $t0, $t1   # h - A[4] + B[2]
      sw  $t0, 24($s2)    # B[6] = result`
  },
  ifelse: {
    name: 'if (i == j) f = g + h; else f = g − h  · L06 s17',
    regs: '$s1=10, $s2=3, $s3=5, $s4=5',
    code: `# f $s0, g $s1, h $s2, i $s3, j $s4  — try i != j too
      bne $s3, $s4, Else  # go to Else if i != j
      add $s0, $s1, $s2   # f = g + h  (skipped if i != j)
      j   Exit            # skip the else part
Else: sub $s0, $s1, $s2   # f = g - h
Exit: nop`
  },
  loop: {
    name: 'while (save[i] == k) i += 1  · P&H §2.7 (textbook)',
    regs: '$s3=0, $s5=7',
    code: `.data
save: .word 7, 7, 7, 3, 7
.text
       la   $s6, save        # base of save[]
Loop:  sll  $t1, $s3, 2      # t1 = i * 4
       add  $t1, $t1, $s6    # address of save[i]
       lw   $t0, 0($t1)      # t0 = save[i]
       bne  $t0, $s5, Exit   # leave if save[i] != k
       addi $s3, $s3, 1      # i = i + 1
       j    Loop
Exit:  nop                   # i ($s3) = 3 here`
  },
  ps1q7: {
    name: 'a × b + 100 by repeated addition  · PS1 Q7',
    regs: '$a0=6, $a1=7',
    code: `        add  $t0, $zero, $zero   # result = 0
loop:   beq  $a1, $zero, finish  # stop when b reaches 0
        add  $t0, $t0, $a0       # result += a
        addiu $a1, $a1, -1       # b = b - 1
        j    loop
finish: addi $t0, $t0, 100       # result += 100
        add  $v0, $t0, $zero     # return value in $v0`
  },
  leaf: {
    name: 'leaf_example with the stack  · L06 s20',
    regs: '$a0=10, $a1=20, $a2=3, $a3=4, $s0=999',
    code: `# int leaf_example(g, h, i, j) { f = (g + h) - (i + j); return f; }
main:   jal  leaf_example      # call it; $ra = return address
        move $s1, $v0           # use the result
        li   $v0, 10            # exit
        syscall
leaf_example:
        addi $sp, $sp, -4       # make room for one word
        sw   $s0, 0($sp)        # save the caller's $s0
        add  $t0, $a0, $a1      # g + h
        add  $t1, $a2, $a3      # i + j
        sub  $s0, $t0, $t1      # f
        add  $v0, $s0, $zero    # return f
        lw   $s0, 0($sp)        # restore $s0 (999 again)
        addi $sp, $sp, 4        # pop the stack
        jr   $ra                # return`
  },
  swap: {
    name: 'swap(v, k)  · L07 s10',
    regs: '$a1=2',
    code: `.data
v:  .word 10, 20, 30, 40, 50
.text
main:  la   $a0, v           # $a0 = address of v
       jal  swap             # swap v[2] and v[3]
       li   $v0, 10
       syscall
swap:  sll  $t1, $a1, 2      # $t1 = k * 4
       add  $t1, $a0, $t1    # address of v[k]
       lw   $t0, 0($t1)      # temp = v[k]
       lw   $t2, 4($t1)      # $t2 = v[k+1]
       sw   $t2, 0($t1)      # v[k] = v[k+1]
       sw   $t0, 4($t1)      # v[k+1] = temp
       jr   $ra`
  },
  fact: {
    name: 'Recursive factorial: watch the stack grow  · P&H §2.8 (textbook)',
    regs: '$a0=4',
    code: `main:  jal  fact             # fact(4)
       move $a0, $v0
       li   $v0, 1           # print_int
       syscall
       li   $v0, 10
       syscall
fact:  addi $sp, $sp, -8     # room for 2 words
       sw   $ra, 4($sp)      # save return address
       sw   $a0, 0($sp)      # save n
       slti $t0, $a0, 1      # n < 1 ?
       beq  $t0, $zero, L1   # if n >= 1, recurse
       addi $v0, $zero, 1    # return 1
       addi $sp, $sp, 8      # pop
       jr   $ra
L1:    addi $a0, $a0, -1     # n - 1
       jal  fact             # fact(n - 1)
       lw   $a0, 0($sp)      # restore n
       lw   $ra, 4($sp)      # restore return address
       addi $sp, $sp, 8      # pop
       mul  $v0, $a0, $v0    # n * fact(n - 1)
       jr   $ra`
  },
  sum: {
    name: 'Sum an array with a loop and blt',
    regs: '',
    code: `.data
A:    .word 3, 1, 4, 1, 5, 9, 2, 6
n:    .word 8
.text
      la   $t0, A          # pointer to A[0]
      lw   $t1, n          # n (pseudo: la $at + lw)
      li   $t2, 0          # i = 0
      li   $v1, 0          # sum = 0
loop: bge  $t2, $t1, done  # pseudo: slt $at + beq
      lw   $t3, 0($t0)     # A[i]
      add  $v1, $v1, $t3   # sum += A[i]
      addi $t0, $t0, 4     # next word
      addi $t2, $t2, 1     # i++
      j    loop
done: move $a0, $v1
      li   $v0, 1          # print the sum
      syscall`
  }
};
