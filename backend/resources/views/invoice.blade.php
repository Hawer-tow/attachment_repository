<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $type === 'receipt' ? 'Receipt' : 'Invoice' }} {{ $booking->booking_reference }}</title>
    <style>
        @page { margin: 0; }
        * { box-sizing: border-box; }
        body {
            font-family: 'DejaVu Sans', 'Helvetica', sans-serif;
            font-size: 11px;
            color: #0f172a;
            margin: 0;
            padding: 0;
            line-height: 1.45;
        }
        .page { padding: 36px 40px; }

        /* Brand bar */
        .brand-bar {
            background: linear-gradient(135deg, #06b6d4 0%, #0891b2 50%, #0e7490 100%);
            color: #ffffff;
            padding: 22px 32px;
        }
        .brand-bar table { width: 100%; border-collapse: collapse; }
        .brand-bar td { vertical-align: middle; }
        .logo-cell { width: 64px; }
        .logo-box {
            width: 56px; height: 56px;
            border-radius: 12px;
            background: rgba(255,255,255,0.18);
            text-align: center;
            color: #ffffff;
            font-weight: 700;
            font-size: 26px;
            line-height: 56px;
            letter-spacing: -1px;
            border: 1px solid rgba(255,255,255,0.35);
        }
        .brand-name {
            font-size: 22px; font-weight: 700; letter-spacing: 0.4px; margin: 0;
        }
        .brand-tag { font-size: 10px; opacity: 0.85; margin: 2px 0 0 0; letter-spacing: 0.6px; text-transform: uppercase; }
        .doc-type {
            text-align: right;
            font-size: 11px; letter-spacing: 2px; text-transform: uppercase; opacity: 0.9;
        }
        .doc-ref { font-size: 14px; font-weight: 700; margin-top: 2px; }

        /* Meta grid */
        .meta {
            width: 100%;
            margin: 18px 0 14px 0;
        }
        .meta td { vertical-align: top; }
        .meta-label {
            font-size: 9px; text-transform: uppercase; letter-spacing: 1.2px;
            color: #64748b; font-weight: 700; margin: 0 0 3px 0;
        }
        .meta-value { font-size: 12px; font-weight: 600; color: #0f172a; margin: 0; }
        .meta-sub { font-size: 10px; color: #475569; margin: 1px 0 0 0; }
        .meta-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 14px;
        }

        h2.section {
            font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px;
            color: #0891b2; font-weight: 700; margin: 22px 0 8px 0;
            border-bottom: 1px solid #cffafe; padding-bottom: 4px;
        }

        /* Tables */
        table.charges { width: 100%; border-collapse: collapse; margin-top: 6px; }
        table.charges th {
            text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 1.2px;
            color: #64748b; font-weight: 700; padding: 8px 10px;
            background: #f1f5f9; border-bottom: 1px solid #e2e8f0;
        }
        table.charges td {
            padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 11px;
        }
        table.charges td.num { text-align: right; font-variant-numeric: tabular-nums; }
        table.charges tr.total td {
            background: #ecfeff; color: #0e7490; font-weight: 700; font-size: 12px;
        }
        table.charges tr.due td {
            background: #0e7490; color: #ffffff; font-weight: 700; font-size: 13px;
        }

        .pill {
            display: inline-block; padding: 2px 8px; border-radius: 999px;
            font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px;
        }
        .pill-paid    { background: #d1fae5; color: #065f46; }
        .pill-pending { background: #fef3c7; color: #92400e; }
        .pill-cancel  { background: #fee2e2; color: #991b1b; }

        /* Totals card */
        .totals { margin-top: 14px; }
        .totals table { width: 100%; border-collapse: collapse; }
        .totals td { padding: 5px 8px; font-size: 11px; }
        .totals td.label { color: #475569; }
        .totals td.value { text-align: right; font-weight: 600; }
        .totals tr.grand td { font-size: 13px; font-weight: 700; color: #0e7490; padding-top: 8px; border-top: 2px solid #06b6d4; }

        /* Signature */
        .signoff {
            margin-top: 36px;
            border-top: 1px dashed #cbd5e1;
            padding-top: 14px;
        }
        .signoff table { width: 100%; border-collapse: collapse; }
        .signoff td { vertical-align: top; }
        .signoff .signature {
            font-family: 'Brush Script MT', 'Lucida Handwriting', cursive;
            font-size: 28px; color: #06b6d4; font-style: italic;
            border-bottom: 1px solid #0f172a;
            padding: 0 6px 4px 6px; display: inline-block;
            transform: skew(-4deg);
        }
        .signoff .sig-name { font-size: 10px; color: #475569; margin-top: 4px; }
        .signoff .stamp {
            text-align: right; color: #64748b; font-size: 10px;
        }

        /* Footer */
        .footer {
            margin-top: 28px;
            background: #0f172a;
            color: #cbd5e1;
            padding: 14px 32px;
            text-align: center;
            font-size: 9.5px;
        }
        .footer .brand-mini { color: #67e8f9; font-weight: 700; letter-spacing: 1px; }
        .footer a { color: #67e8f9; text-decoration: none; }

        .barcode {
            font-family: 'Libre Barcode 39', 'Courier New', monospace;
            font-size: 28px; letter-spacing: 2px; color: #0f172a;
        }
    </style>
</head>
<body>
    <div class="page">
        <div class="brand-bar">
            <table>
                <tr>
                    <td class="logo-cell"><div class="logo-box">S</div></td>
                    <td>
                        <p class="brand-name">{{ config('app.name', 'StaySync HMS') }}</p>
                        <p class="brand-tag">Hospitality · Smart Stays · Signature Service</p>
                    </td>
                    <td class="doc-type">
                        {{ $type === 'receipt' ? 'OFFICIAL RECEIPT' : 'TAX INVOICE' }}
                        <div class="doc-ref">#{{ $booking->booking_reference }}</div>
                    </td>
                </tr>
            </table>
        </div>

        <table class="meta">
            <tr>
                <td style="width: 50%; padding-right: 10px;">
                    <div class="meta-card">
                        <p class="meta-label">Billed to</p>
                        <p class="meta-value">{{ $booking->guest->first_name }} {{ $booking->guest->last_name }}</p>
                        <p class="meta-sub">{{ $booking->guest->email ?: '—' }}</p>
                        <p class="meta-sub">{{ $booking->guest->phone ?: '—' }}</p>
                    </div>
                </td>
                <td style="width: 50%; padding-left: 10px;">
                    <div class="meta-card">
                        <p class="meta-label">{{ $type === 'receipt' ? 'Receipt' : 'Invoice' }} details</p>
                        <p class="meta-value">
                            Issued {{ now()->format('d M Y') }}
                            @if($type === 'receipt')
                                · Paid
                            @endif
                        </p>
                        <p class="meta-sub">Booking #{{ $booking->booking_reference }}</p>
                        <p class="meta-sub">Source: {{ ucfirst(str_replace('_', ' ', $booking->source ?? 'direct')) }}</p>
                    </div>
                </td>
            </tr>
        </table>

        <h2 class="section">Stay details</h2>
        <table class="charges">
            <thead>
                <tr>
                    <th>Description</th>
                    <th style="text-align:center;">Nights</th>
                    <th style="text-align:right;">Rate / night</th>
                    <th style="text-align:right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <strong>Room {{ $booking->room->room_number }}</strong> — {{ $booking->roomType->name ?? 'Standard' }}<br>
                        <span style="color:#64748b; font-size:10px;">
                            Check-in {{ \Carbon\Carbon::parse($booking->check_in_date)->format('d M Y') }}
                            &nbsp;·&nbsp; Check-out {{ \Carbon\Carbon::parse($booking->check_out_date)->format('d M Y') }}
                            &nbsp;·&nbsp; {{ $booking->num_adults }} adults{{ $booking->num_children ? ', ' . $booking->num_children . ' children' : '' }}
                        </span>
                    </td>
                    <td class="num" style="text-align:center;">
                        {{ \Carbon\Carbon::parse($booking->check_in_date)->diffInDays(\Carbon\Carbon::parse($booking->check_out_date)) }}
                    </td>
                    <td class="num">
                        KES {{ number_format($booking->roomType->base_price ?? 0, 2) }}
                    </td>
                    <td class="num">
                        KES {{ number_format($booking->subtotal ?? $booking->total_price, 2) }}
                    </td>
                </tr>
            </tbody>
        </table>

        <div class="totals">
            <table>
                <tr>
                    <td class="label" style="width: 70%; text-align:right;">Subtotal</td>
                    <td class="value" style="width: 30%;">KES {{ number_format($booking->subtotal ?? $booking->total_price, 2) }}</td>
                </tr>
                @if(($booking->discount_amount ?? 0) > 0)
                <tr>
                    <td class="label" style="text-align:right;">Discount</td>
                    <td class="value" style="color:#059669;">− KES {{ number_format($booking->discount_amount, 2) }}</td>
                </tr>
                @endif
                <tr>
                    <td class="label" style="text-align:right;">Tax (16% VAT)</td>
                    <td class="value">KES {{ number_format($booking->tax_amount ?? 0, 2) }}</td>
                </tr>
                <tr class="grand">
                    <td class="label" style="text-align:right;">Total</td>
                    <td class="value">KES {{ number_format($booking->total_price, 2) }}</td>
                </tr>
            </table>
        </div>

        <h2 class="section">Payments</h2>
        <table class="charges">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Method</th>
                    <th>Reference</th>
                    <th style="text-align:right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($booking->payments as $payment)
                    <tr>
                        <td>{{ optional($payment->paid_at)->format('d M Y') ?? '—' }}</td>
                        <td>{{ strtoupper($payment->payment_method) }}</td>
                        <td>{{ $payment->transaction_reference ?: '—' }}</td>
                        <td class="num">KES {{ number_format($payment->amount, 2) }}</td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="4" style="text-align:center; color:#64748b; padding:14px 10px;">
                            No payments recorded yet.
                        </td>
                    </tr>
                @endforelse
                @php
                    $paidTotal = $booking->payments->where('status', 'completed')->sum('amount');
                    $balance = max(0, (float)$booking->total_price - (float)$paidTotal);
                @endphp
                @if($paidTotal > 0)
                <tr class="total">
                    <td colspan="3" class="num">Paid to date</td>
                    <td class="num">KES {{ number_format($paidTotal, 2) }}</td>
                </tr>
                @endif
                @if($balance > 0)
                <tr class="due">
                    <td colspan="3" class="num">Balance due</td>
                    <td class="num">KES {{ number_format($balance, 2) }}</td>
                </tr>
                @endif
            </tbody>
        </table>

        <div class="signoff">
            <table>
                <tr>
                    <td style="width: 60%;">
                        <p class="meta-label">Authorised signature</p>
                        <div class="signature">StaySync</div>
                        <p class="sig-name">StaySync Hospitality Group</p>
                    </td>
                    <td class="stamp" style="width: 40%;">
                        <div class="barcode">*{{ $booking->booking_reference }}*</div>
                        <p class="meta-sub" style="margin-top:4px;">Scan or quote this reference for any enquiry.</p>
                    </td>
                </tr>
            </table>
        </div>
    </div>

    <div class="footer">
        <p><span class="brand-mini">{{ strtoupper(config('app.name', 'STAYSYNC')) }}</span> · Thank you for choosing us</p>
        <p>Westlands Road, Nairobi · +254 700 000 000 · info@staysync.com · www.staysync.com</p>
        <p style="margin-top:6px; color:#94a3b8;">
            {{ $type === 'receipt'
                ? 'This receipt is your proof of payment. Keep it for your records.'
                : 'This invoice is computer-generated and valid without a physical signature.' }}
            Generated {{ now()->format('d M Y, H:i') }}.
        </p>
    </div>
</body>
</html>
